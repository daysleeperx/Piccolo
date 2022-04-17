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
  private midiFile: Midi.MidiFile;

  private source: MusicGenerator.Sequence;
 
  private currentSequence: MusicGenerator.Sequence;

  private sequences: Map<string, MusicGenerator.Sequence> = new Map();

  private running: boolean = true;

  private constructor(
       private readonly parser: Midi.Parser,
       private readonly builder: Midi.Builder,
       private readonly generator: MusicGenerator.Generator,
       private readonly oscClient: OSC.Client,
       private readonly options: MidiSourceAppOptions,
  ) {}

  public static createAndInit(options: MidiSourceAppOptions): MidiApplication {
    const parser: Midi.Parser = new MidiParser();
    const builder: Midi.Builder = new MidiBuilder();
    const generator: MusicGenerator.Generator = new MarkovChainMusicGenerator(100, 3);
    const oscClient: OSC.Client = new OSC.Client('localhost', 4560);
    return new MidiApplication(parser, builder, generator, oscClient, options);
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

    [...Array(Number(outputs)).keys()].forEach((i) => {
      const generatedSequence: MusicGenerator.Sequence = this.generator.generate(this.source);
      this.sequences.set(`${out}/${name}_${i}.midi`, generatedSequence);
      const outMidi: Midi.MidiFile = {
        format,
        division,
        ntrks: 1,
        tracks: [Utils.sequenceToMidiTrack(generatedSequence)],
      };
      const outBuffer: Buffer = this.builder.build(outMidi);
      writeFileSync(path.join(__dirname, `${out}/${name}_${i}.midi`), outBuffer);
    });

    await Utils.sleep(2000); /* Cosmetic stuff */
    spinner.succeed(`Generated ${outputs} sequences.`);
  }

  private sendOSCMessage() {
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
      this.sendOSCMessage();

      ({ sendAnother: this.running } = await prompt<{ sendAnother: boolean }>({
        type: 'confirm',
        name: 'sendAnother',
        message: 'Send another sequence via OSC?',
      }));
    }

    this.oscClient.close();
  }
}
