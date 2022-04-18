import * as OSC from 'node-osc';
import { prompt } from 'enquirer';
import path from 'path';
import { Presets, SingleBar } from 'cli-progress';
import { readFileSync, writeFileSync } from 'fs';
import ora from 'ora';
import Utils from '../common/Utils';
import { MidiParser } from '../parser/MidiParser';
import MidiBuilder from '../parser/MidiBuilder';
import MarkovChainMusicGenerator from '../generator/MarkovChainMusicGenerator';
import { CLIApplication } from './CLIApplication';
import { MusicGenerator } from '../generator/Generator';
import { Midi } from '../parser/Parser';

export interface SequentialApplicationOptions {
    source: string;
    out: string;
    name: string;
    outputs: string;
    steps: string;
    order: string;
}

export class SequentialApplication implements CLIApplication {
  private midiFile: Midi.MidiFile;

  private source: MusicGenerator.Sequence;

  private currentSequence: MusicGenerator.Sequence;

  private sequences: Map<string, MusicGenerator.Sequence> = new Map();

  private constructor(
        private readonly parser: Midi.Parser,
        private readonly builder: Midi.Builder,
        private readonly generator: MusicGenerator.Generator,
        private readonly oscClient: OSC.Client,
        private readonly options: SequentialApplicationOptions,
  ) {}

  public static createAndInit(options: SequentialApplicationOptions): SequentialApplication {
    const parser: Midi.Parser = new MidiParser();
    const builder: Midi.Builder = new MidiBuilder();
    const generator: MusicGenerator.Generator = new MarkovChainMusicGenerator(100, 3);
    const oscClient: OSC.Client = new OSC.Client('localhost', 4560);
    return new SequentialApplication(parser, builder, generator, oscClient, options);
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

  private async sendOSCMessages(sequence: MusicGenerator.Sequence): Promise<void> {
    const { notes, quantization: { stepsPerQuater } } = sequence;

    const bar = new SingleBar({}, Presets.shades_classic);
    bar.start(notes.length, 0);

    /* eslint-disable-next-line no-restricted-syntax */
    for (const [idx, [pitch, quantizedSteps]] of notes.entries()) {
      this.oscClient.send(['sequence', pitch]);
      /* eslint-disable-next-line no-await-in-loop */
      await Utils.sleep((quantizedSteps / stepsPerQuater) * 1000);
      bar.update(idx + 1);
    }

    bar.stop();
    this.oscClient.close();
  }

  public async run(): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
