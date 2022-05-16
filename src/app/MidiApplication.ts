import path from 'path';
import { readFileSync, writeFileSync } from 'fs';
import { prompt } from 'enquirer';
import ora from 'ora';
import * as OSC from 'node-osc';
import { MusicGenerator } from '../generator/Generator';
import { Midi } from '../parser/Parser';
import Utils from '../common/Utils';
import { CLIApplication } from './CLIApplication';
import { MidiParser } from '../parser/MidiParser';
import MidiBuilder from '../parser/MidiBuilder';

export interface MidiSourceAppOptions {
    source: string;
    out: string;
    outputs: number;
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
    const options: { options: MidiSourceAppOptions } = await prompt<{ options: MidiSourceAppOptions }>({
      type: 'form',
      name: 'options',
      message: 'Please provide the following information',
      choices: [
        { name: 'source', message: 'Source' },
        { name: 'out', message: 'Out' },
        { name: 'outputs', message: 'No. of outputs' },
        { name: 'name', message: 'Name of output file' },
      ],
    });

    const { type } = await prompt<{ type: string }>({
      type: 'select',
      name: 'type',
      message: 'Choose generator type',
      choices: [
        { name: 'Markov Chain', value: '0' },
        { name: 'Magenta MusicRNN', value: '1' },
      ],
      result() {
        return (this as any).focused.value;
      },
    });

    const generatorType: MusicGenerator.GeneratorType = [
      MusicGenerator.GeneratorType.MARKOV_CHAIN,
      MusicGenerator.GeneratorType.MAGNETA_MUSIC_RNN,
    ][Number(type)];

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
    }

    const genOptions: { options: MusicGenerator.GeneratorOptions } = await prompt<{options: MusicGenerator.GeneratorOptions}>({
      type: 'form',
      name: 'options',
      message: 'Provide generator options',
      choices: genChoices,
    });

    const parser: Midi.Parser = new MidiParser();
    const builder: Midi.Builder = new MidiBuilder();
    const generatorFactory: MusicGenerator.GeneratorFactory = new MusicGenerator.GeneratorFactory();
    const generator: MusicGenerator.Generator = await generatorFactory.createGenerator(generatorType, genOptions.options);
    const oscClient: OSC.Client = new OSC.Client('localhost', 4560);
    return new MidiApplication(parser, builder, generator, oscClient, options.options);
  }

  private async readMidiFile(): Promise<void> {
    const { source } = this.options;

    const buffer: Buffer = readFileSync(path.join(__dirname, source));

    this.midiFile = this.parser.parse(buffer);
    const { format, tracks, division } : Midi.MidiFile = this.midiFile;
    
    let track = 0;
    if (format !== Midi.FileFormat.SINGLE_TRACK) {
      const { response } = await prompt<{ response: string }>({
        type: 'input',
        name: 'response',
        message: 'The provided MIDI track includes multiple tracks. Enter source track number:',
      });
      track = Math.min(Number(response), tracks.length - 1);
    }

    this.source = Utils.extractSequenceFromTrack(tracks[track], { value: 120 }, division);
  }

  private async generateSequences(): Promise<void> {
     const { format, division } = this.midiFile;
     const { out, name, outputs } = this.options;

     for (let i = 0; i < outputs; i++) {
       const generatedSequence: MusicGenerator.Sequence = await this.generator.generate(this.source);
       this.sequences.set(`${out}/${name}_${i}.midi`, Utils.quantizeSequence(generatedSequence));
       const outMidi: Midi.MidiFile = {
         format,
         division,
         ntrks: 1,
         tracks: [Utils.sequenceToMidiTrack(generatedSequence)],
       };
       const outBuffer: Buffer = this.builder.build(outMidi);
       writeFileSync(path.join(__dirname, `${out}/${name}_${i}.midi`), outBuffer);
     }

    await Utils.sleep(2000); /* Cosmetic stuff */
  }

  protected async sendOSCMessage(): Promise<void> {
    const { notes, quantization: { stepsPerQuarter } } = this.currentSequence;
    const [pitches, durations] : [number[], number[]] = [[], []];
    notes.forEach(([pitch, duration]) => {
      pitches.push(pitch);
      durations.push(duration / stepsPerQuarter);
    });

    this.oscClient.send(['/gen/sequence', ...pitches]);
    this.oscClient.send(['/gen/steps', ...durations]);
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

    while (this.running) {
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
    }

    this.oscClient.close();
  }
}
