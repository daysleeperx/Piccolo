import path from 'path';
import { readFileSync, writeFileSync } from 'fs';
import { prompt } from 'enquirer';
import ora from 'ora';
import * as OSC from 'node-osc';
import { MusicGenerator } from '../generator/Generator';
import { Midi } from '../parser/Parser';
import Utils from '../common/Utils';
import { CLIApplication } from './CLIApplication';
import MidiParser from '../parser/MidiParser';
import MidiBuilder from '../parser/MidiBuilder';
import UnreachableCode from '../common/UnreachableCode';
import TypeGuards from '../common/TypeGuards';

export interface MidiSourceAppOptions {
    source: string;
    out: string;
    outputs: string;
    name: string;
}

export class MidiApplication implements CLIApplication {
  protected midiFile: Midi.MidiFile;

  private source: MusicGenerator.Sequence;

  protected currentSequence: MusicGenerator.Sequence;

  private sequences: Map<string, MusicGenerator.Sequence> = new Map();

  private running = true;

  protected constructor(
       protected readonly parser: Midi.Parser,
       protected readonly builder: Midi.Builder,
       protected readonly generator: MusicGenerator.Generator,
       protected readonly oscClient: OSC.Client,
       protected readonly options: MidiSourceAppOptions,
  ) {}

  public static async createAndInit(): Promise<MidiApplication> {
    const options: { options: MidiSourceAppOptions } = await prompt<{
      options: MidiSourceAppOptions
    }>({
      type: 'form',
      name: 'options',
      message: 'Please provide the following information',
      choices: [
        { name: 'source', message: 'Source' },
        { name: 'out', message: 'Out' },
        { name: 'outputs', message: 'No. of outputs' },
        { name: 'name', message: 'Name of output file' },
      ],
      validate: (value) => {
        const { outputs } = (value as unknown) as MidiSourceAppOptions;
        if (Number.isNaN(Number(outputs)) || !Number.isInteger(Number(outputs))) {
          return 'No. of ouputs must be a Number!';
        }
        return true;
      },
    });

    const { type } = await prompt<{ type: string }>({
      type: 'select',
      name: 'type',
      message: 'Choose generator type',
      choices: [
        { name: 'Markov Chain' },
        { name: 'Magenta MusicRNN' },
      ],
    });

    const generatorType: MusicGenerator.GeneratorType = MusicGenerator.GeneratorType[
      Object.keys(MusicGenerator.GeneratorType).find(
        (k) => MusicGenerator.GeneratorType[k as MusicGenerator.GeneratorTypeKey] === type,
      ) as MusicGenerator.GeneratorTypeKey
    ];

    let genChoices;

    switch (generatorType) {
      case MusicGenerator.GeneratorType.MARKOV_CHAIN:
        genChoices = [
          { name: 'order', message: 'The order of the Markov chain' },
          { name: 'steps', message: 'Number of steps to be generated' },
        ];
        break;
      case MusicGenerator.GeneratorType.MAGNETA_MUSIC_RNN:
        genChoices = [
          { name: 'steps', message: 'Number of steps to be generated' },
          { name: 'temperature', message: 'The temparature of the MusicRNN' },
          { name: 'chordProgression', message: 'Chord progression the sequence should be based on (comma-separated)' },
        ];
        break;
      default:
        UnreachableCode.never(generatorType);
    }

    const genOptions: { options: MusicGenerator.GeneratorOptions } = await prompt<{
      options: MusicGenerator.GeneratorOptions
    }>({
      type: 'form',
      name: 'options',
      message: 'Provide generator options',
      choices: genChoices,
      validate: (value) => {
        const opts = (value as unknown) as MusicGenerator.GeneratorOptions;
        if (TypeGuards.isMarkovChainMusicGeneratorOptions(opts)) {
          const { order, steps } = opts;
          if (
            Number.isNaN(Number(order)) ||
            !Number.isInteger(Number(order)) ||
            Number.isNaN(Number(steps)) ||
            !Number.isInteger(Number(steps))
          ) {
            return 'Markov Chain Music Generator options order and steps must be integers!';
          }
        }
        if (TypeGuards.isMagentaMusicGeneratorOptions(opts)) {
          const { temperature, steps } = opts;
          if (
            Number.isNaN(Number(temperature)) ||
            Number.isNaN(Number.parseFloat(temperature.toString())) ||
            Number.isNaN(Number(steps)) ||
            !Number.isInteger(Number(steps))
          ) {
            return 'Magenta MusicRNN Music Generator options temperature and steps must be numbers!';
          }
        }
        return true;
      },
    });

    const parser: Midi.Parser = new MidiParser();
    const builder: Midi.Builder = new MidiBuilder();
    const generator: MusicGenerator.Generator =
      await MusicGenerator.GeneratorFactory.createGenerator(generatorType, genOptions.options);
    const oscClient: OSC.Client = new OSC.Client('localhost', 4560);
    return new MidiApplication(parser, builder, generator, oscClient, options.options);
  }

  private async readMidiFile(): Promise<void> {
    const { source } = this.options;

    const buffer: Buffer = readFileSync(path.join(process.cwd(), source));

    this.midiFile = this.parser.parse(buffer);
    const { format, tracks, division } : Midi.MidiFile = this.midiFile;

    let track = 0;
    if (format !== Midi.FileFormat.SINGLE_TRACK) {
      ({ response: track } = await prompt<{ response: number }>({
        type: 'numeral',
        name: 'response',
        min: 0,
        max: tracks.length - 1,
        message: 'The provided MIDI track includes multiple tracks. Enter source track number:',
      }));
      track = Math.max(0, Math.min(track, tracks.length - 1)); /* due to https://github.com/enquirer/enquirer/issues/104 */
    }

    this.source = Utils.extractSequenceFromTrack(tracks[track], { value: 120 }, division);
  }

  private async generateSequences(): Promise<void> {
    const { format, division } = this.midiFile;
    const { out, name, outputs } = this.options;

    const generatedSequences: MusicGenerator.Sequence[] = await Promise.all(
      [...Array(Number(outputs)).keys()].reduce<Promise<MusicGenerator.Sequence>[]>(
        (acc, _) => [...acc, this.generator.generate(this.source)],
        [],
      ),
    );

    generatedSequences.forEach((seq, idx) => {
      this.sequences.set(`${out}/${name}_${idx}.midi`, Utils.quantizeSequence(seq));
      const outMidi: Midi.MidiFile = {
        format,
        division,
        ntrks: 1,
        tracks: [Utils.sequenceToMidiTrack(seq)],
      };
      const outBuffer: Buffer = this.builder.build(outMidi);
      writeFileSync(path.join(process.cwd(), `${out}/${name}_${idx}.midi`), outBuffer);
    });
  }

  protected async sendOSCMessage(): Promise<void> {
    const { notes, quantization: { stepsPerQuarter } } = this.currentSequence;
    const pitches: number[] = notes.reduce((acc, [pitch, _]) => [...acc, pitch], []);
    const steps: number[] = notes.reduce((acc, [_, qs]) => [...acc, qs / stepsPerQuarter], []);

    this.oscClient.send(['/gen/sequence', ...pitches]);
    this.oscClient.send(['/gen/steps', ...steps]);
  }

  public async run(): Promise<void> {
    await this.readMidiFile();
    const spinner = ora('Generating sequences...').start();
    await this.generateSequences();
    spinner.succeed(`Generated ${this.sequences.size} sequences.`);

    ({ sendOsc: this.running } = await prompt<{ sendOsc: boolean }>({
      type: 'confirm',
      name: 'sendOsc',
      message: 'Send sequence via OSC?',
    }));

    await this.processLoop();

    this.oscClient.close();
  }

  private async processLoop(): Promise<void> {
    if (!this.running) {
      return;
    }

    const { seq } = await prompt<{ seq: string }>({
      type: 'select',
      name: 'seq',
      message: 'Choose sequence',
      choices: [...this.sequences.keys()],
    });

    this.currentSequence = this.sequences.get(seq);
    await this.sendOSCMessage();

    ({ sendAnother: this.running } = await prompt<{ sendAnother: boolean }>({
      type: 'confirm',
      name: 'sendAnother',
      message: 'Send another sequence via OSC?',
    }));

    await this.processLoop();
  }
}
