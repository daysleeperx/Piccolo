import { prompt } from 'enquirer';
import figlet from 'figlet';
import { Command } from 'commander';
import { Midi } from './parser/Parser';
import { MidiParser } from './parser/MidiParser';
import MidiBuilder from './parser/MidiBuilder';
import { MusicGenerator } from './generator/Generator';
import MarkovChainMusicGenerator from './generator/MarkovChainMusicGenerator';
import { log } from './common/Utils';
import * as OSC from 'node-osc';
import { MidiSourceApp, MidiSourceAppOptions } from './app/MidiSourceApp';

function initCommander(): Command {
  const program: Command = new Command();

  program
    .name('music-generator')
    .option('-i, --source <value>')
    .option('-o, --out <value>')
    .option('-n, --name <value>')
    .option('-nn, --outputs <value>')
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
  let options: MidiSourceAppOptions;

  if (Object.keys(program.opts()).length === 0) {
    options = await prompt<MidiSourceAppOptions>([
      {
        type: 'input',
        name: 'source',
        message: 'Enter source MIDI file path (relative):',
      },
      {
        type: 'input',
        name: 'out',
        message: 'Enter output direction path (relative):',
      },
      {
        type: 'input',
        name: 'name',
        message: 'Enter the name of output file(s):',
      },
      {
        type: 'input',
        name: 'outputs',
        message: 'Enter the number of outputs:',
      }
    ]);
  } else {
    options = program.opts() as MidiSourceAppOptions;
    log(options);
  }

  const parser: Midi.Parser = new MidiParser();
  const builder: Midi.Builder = new MidiBuilder();
  const generator: MusicGenerator.Generator = new MarkovChainMusicGenerator(100, 3);
  const oscClient: OSC.Client= new OSC.Client('localhost', 4560);
  const cliApp: MidiSourceApp = new MidiSourceApp(parser, builder, generator, oscClient, options);

  await cliApp.run();
}

main();
