import { prompt } from 'enquirer';
import { Presets, SingleBar } from 'cli-progress';
import { readFileSync, writeFileSync } from 'fs';
import ora from 'ora';
import path from 'path';
import { extractSequenceFromTrack, sequenceToMidiTrack, sleep } from './common/Utils';
import { MusicGenerator } from './generator/Generator';
import { OSC } from './osc/OSC';
import { Midi } from './parser/Parser';

export interface CLIOptions {
    source: string;
    output: string;
    name: string;
    outputsNum: string;
    steps: string;
    order: string;
}

export class CLIApplication {
  constructor(
        private readonly parser: Midi.Parser,
        private readonly builder: Midi.Builder,
        private readonly generator: MusicGenerator.Generator,
        private readonly oscClient: OSC.Client<MusicGenerator.Pitch>,
        private readonly options: CLIOptions,
  ) {}

  public async runCli(): Promise<void> {
    const {
      source, output, name, outputsNum,
    } = this.options;

    const buffer: Buffer = readFileSync(path.join(__dirname, source));

    const { format, tracks, division } : Midi.MidiFile = this.parser.parse(buffer);

    let track = 0;
    if (format !== Midi.FileFormat.SINGLE_TRACK) {
      const { response } = await prompt<{response: string}>({
        type: 'input',
        name: 'response',
        message: 'The provided MIDI track includes multiple tracks. Enter source track number:',
      });
      track = Math.min(Number(response), tracks.length - 1);
    }

    const spinner = ora('Generating sequences...').start();

    const sequence: MusicGenerator.Sequence = extractSequenceFromTrack(
      tracks[track],
      { value: 120 },
      division,
    );

    const sequences: Map<string, MusicGenerator.Sequence> = new Map();
    [...Array(Number(outputsNum)).keys()].forEach((i) => {
      const generatedSequence: MusicGenerator.Sequence = this.generator.generate(sequence);
      sequences.set(`${output}/${name}_${i}.midi`, generatedSequence);
      const outMidi: Midi.MidiFile = {
        format,
        division,
        ntrks: 1,
        tracks: [sequenceToMidiTrack(generatedSequence)],
      };
      const outBuffer: Buffer = this.builder.build(outMidi);
      writeFileSync(path.join(__dirname, `${output}/${name}_${i}.midi`), outBuffer);
    });

    await sleep(2000);

    spinner.succeed(`Generated ${outputsNum} sequences.`);

    const { osc } = await prompt<{osc: string}>({
      type: 'confirm',
      name: 'osc',
      message: 'Send sequence via OSC?',
    });

    if (osc) {
      const { seq } = await prompt<{ seq: string }>({
        type: 'select',
        name: 'seq',
        message: 'Choose sequence',
        choices: [...sequences.keys()],
      });
      this.sendOSCMessages(sequences.get(seq));
    }
  }

  private async sendOSCMessages(sequence: MusicGenerator.Sequence): Promise<void> {
    const { notes, quantization: { stepsPerQuater } } = sequence;

    this.oscClient.start();

    const bar = new SingleBar({}, Presets.shades_classic);
    bar.start(notes.length, 0);

    /* eslint-disable-next-line no-restricted-syntax */
    for (const [idx, [pitch, quantizedSteps]] of notes.entries()) {
      this.oscClient.send(pitch);
      /* eslint-disable-next-line no-await-in-loop */
      await sleep((quantizedSteps / stepsPerQuater) * 1000);
      bar.update(idx + 1);
    }

    bar.stop();
    this.oscClient.close();
  }
}
