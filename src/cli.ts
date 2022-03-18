import { readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { prompt } from 'enquirer';
import ora from 'ora';
import figlet from 'figlet';
import { Midi } from './parser/Parser';
import { MidiParser } from './parser/MidiParser';
import MidiBuilder from './parser/MidiBuilder';
import { MusicGenerator } from './generator/Generator';
import MarkovChainMusicGenerator from './generator/MarkovChainMusicGenerator';
import { extractSequenceFromTrack, sequenceToMidiTrack, sleep } from './common/Utils';
import { OSC } from './osc/OSC';
import OSCClient from './osc/OSCClient';

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
        private readonly oscClient: OSC.Client<MusicGenerator.Pitch>,
        private readonly options: CLIOptions,
  ) {}

  private async sendOSCMessages(sequence: MusicGenerator.Sequence): Promise<void> {
    const { notes, quantization } = sequence;

    for (const [pitch, quantizedSteps] of notes) {
      this.oscClient.send(pitch);
      await sleep(quantizedSteps / quantization.stepsPerQuater * 1000);
    }
  }

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

    const sequences: MusicGenerator.Sequence[] = [];
    [...Array(Number(outputsNum)).keys()].forEach((i) => {
      const generatedSequence: MusicGenerator.Sequence = this.generator.generate(sequence);
      sequences.push(generatedSequence);
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

    const response = await prompt<{osc: string}>({
      type: 'confirm',
      name: 'osc',
      message: 'Send sequence via OSC?'
    });
    console.log(response);
  }
}

async function generateAsciiArt() {
  return new Promise((resolve, reject) => {
    figlet.text(
      'Music Generation',
      {
        font: 'Larry 3D',
        horizontalLayout: 'default',
        verticalLayout: 'default',
      },
      (err, data) => {
        if (err) {
          /* eslint-disable no-console */
          console.log('Something went wrong...');
          console.dir(err);
          reject(err);
        }
        resolve(data);
      },
    );
  });
}

async function main() {
  /* eslint-disable no-console */
  console.log(await generateAsciiArt());

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
  const generator: MusicGenerator.Generator = new MarkovChainMusicGenerator(
    Number(steps),
    Number(order),
  );
  const oscClient: OSC.Client<MusicGenerator.Pitch> = new OSCClient({
    host: 'localhost',
    port: 4560,
    path: '/trigger/prophet',
  });
  const cliApp: CLIApplication = new CLIApplication(parser, builder, generator, oscClient, options);

  await cliApp.runCli();
}

main();
