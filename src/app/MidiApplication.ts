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
import MarkovChainMusicGenerator from '../generator/MarkovChainMusicGenerator';

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

  private running: boolean = true;

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
        { name: 'source', message: 'Source'},
        { name: 'out', message: 'Out'},
        { name: 'outputs', message: 'No. of outputs'},
        { name: 'name', message: 'Name of output file'},
      ]
    });

    const parser: Midi.Parser = new MidiParser();
    const builder: Midi.Builder = new MidiBuilder();
    const generator: MusicGenerator.Generator = new MarkovChainMusicGenerator(100, 3);
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
    const spinner = ora('Generating sequences...').start();

    const { format, division } = this.midiFile;
    const { out, name, outputs } = this.options;

    for (let i = 0; i < outputs; i++) {
      const generatedSequence: MusicGenerator.Sequence = await this.generator.generate(this.source);
      this.sequences.set(`${out}/${name}_${i}.midi`, generatedSequence);
      const outMidi: Midi.MidiFile = {
        format,
        division,
        ntrks: 1,
        tracks: [Utils.sequenceToMidiTrack(generatedSequence)],
      };
      const outBuffer: Buffer = this.builder.build(outMidi);
      writeFileSync(path.join(__dirname, `${out}/${name}_${i}.midi`), outBuffer);
    };

    await Utils.sleep(2000); /* Cosmetic stuff */
    spinner.succeed(`Generated ${outputs} sequences.`);
  }

  protected async sendOSCMessage(): Promise<void> {
    const { notes, quantization: { stepsPerQuater } } = this.currentSequence;
    const [pitches, durations] : [number[], number[]] = [[], []];
    notes.forEach(([pitch, duration]) => {
      pitches.push(pitch);
      durations.push(duration / stepsPerQuater);
    });

    this.oscClient.send(['/gen/sequence', ...pitches]);
    this.oscClient.send(['/gen/steps', ...durations]);
  }

  public async run(): Promise<void> {
    await this.readMidiFile();
    await this.generateSequences();

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
