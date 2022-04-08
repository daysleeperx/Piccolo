import { prompt } from 'enquirer';
import figlet from 'figlet';
import { Command } from 'commander';
import { Midi } from './parser/Parser';
import { MidiParser } from './parser/MidiParser';
import MidiBuilder from './parser/MidiBuilder';
import { MusicGenerator } from './generator/Generator';
import MarkovChainMusicGenerator from './generator/MarkovChainMusicGenerator';
import { log } from './common/Utils';
import { OSC } from './osc/OSC';
import OSCClient from './osc/OSCClient';
import { CLIApplication, CLIOptions } from './CLIApplication';

function initCommander(): Command {
  const program: Command = new Command();

  program
    .name('music-generator')
    .option('-i, --source <value>')
    .option('-o, --output <value>')
    .option('-n, --name <value>')
    .option('-nn, --outputsNum <value>')
    .option('-s, --steps <value>')
    .option('-r, --order <value>')
    .parse(process.argv);

  return program;
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
          log('Something went wrong...', err);
          reject(err);
        }
        resolve(data);
      },
    );
  });
}

async function main() {
  log(await generateAsciiArt());
  const program: Command = initCommander();
  let options: CLIOptions;

  if (Object.keys(program.opts()).length === 0) {
    options = await prompt<CLIOptions>([
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
  } else {
    options = program.opts() as CLIOptions;
    log(options);
  }

  const { steps, order } = options;

  const parser: Midi.Parser = new MidiParser();
  const builder: Midi.Builder = new MidiBuilder();
  const generator: MusicGenerator.Generator = new MarkovChainMusicGenerator(
    Number(steps),
    Number(order),
  );
  const oscClient: OSC.Client<number[]> = new OSCClient({
    host: 'localhost',
    port: 4560,
    path: '/melody/notes',
  });
  const cliApp: CLIApplication = new CLIApplication(parser, builder, generator, oscClient, options);

  await cliApp.runCli();
}

main();
