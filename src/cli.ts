import { readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { prompt } from 'enquirer';
import ora from 'ora';
import { Midi } from './parser/Parser';
import { MidiParser } from './parser/MidiParser';
import MidiBuilder from './parser/MidiBuilder';
import { MusicGenerator } from './generator/Generator';
import MarkovChainMusicGenerator from './generator/MarkovChainMusicGenerator';
import { extractSequenceFromTrack, sequenceToMidiTrack } from './common/Utils';

interface CLIOptions {
    source: string;
    output: string;
    name: string;
    outputsNum: string;
    steps: string;
    order: string;
}

class CLIApplication {
  constructor(
        private readonly parser: Midi.Parser,
        private readonly builder: Midi.Builder,
        private readonly generator: MusicGenerator.Generator,
        private readonly options: CLIOptions,
  ) {}

  public async runCli(): Promise<void> {
    const buffer: Buffer = readFileSync(path.join(__dirname, this.options.source));

    const { format, tracks, division } : Midi.MidiFile = this.parser.parse(buffer);

    let track = 0;
    if (format !== Midi.FileFormat.SINGLE_TRACK) {
      const { response } = await prompt<{response: string}>({
        type: 'input',
        name: 'response',
        message: 'The provided MIDI track includes multiple tracks. Enter source track number:',
      });
      track = Number(response);
    }

    const spinner = ora('Generating sequences...').start();

    const sequence: MusicGenerator.Sequence = extractSequenceFromTrack(tracks[track], { value: 120 }, division);

    [...Array(+this.options.outputsNum).keys()].forEach((i) => {
      const generatedSequence: MusicGenerator.Sequence = this.generator.generate(sequence);
      const outMidi: Midi.MidiFile = {
        format,
        division,
        ntrks: 1,
        tracks: [sequenceToMidiTrack(generatedSequence)],
      };
      const outBuffer: Buffer = this.builder.build(outMidi);
      writeFileSync(`${this.options.output}/${this.options.name}_${i}.midi`, outBuffer);
    });

    spinner.succeed('Done.');
  }
}

async function main() {
  const options = await prompt<CLIOptions>([
    {
      type: 'input',
      name: 'source',
      message: 'Enter source MIDI file path (relative):',
    },
    {
      type: 'input',
      name: 'output',
      message: 'Enter output direction path (relative):',
    },
    {
      type: 'input',
      name: 'name',
      message: 'Enter the name of output file(s):',
    },
    {
      type: 'input',
      name: 'outputsNum',
      message: 'Enter the number of outputs:',
    },
    {
      type: 'input',
      name: 'steps',
      message: 'Enter the number of steps to be generated:',
    },
    {
      type: 'input',
      name: 'order',
      message: 'Enter the order of Markov chain:',
    },
  ]);

  const { steps, order } = options;

  const parser: Midi.Parser = new MidiParser();
  const builder: Midi.Builder = new MidiBuilder();
  const generator: MusicGenerator.Generator = new MarkovChainMusicGenerator(Number(steps), Number(order));
  const cliApp: CLIApplication = new CLIApplication(parser, builder, generator, options);

  await cliApp.runCli();
}

main();
