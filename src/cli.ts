import { prompt } from 'enquirer';
import figlet from 'figlet';
import { Command } from 'commander';
import { MidiSourceAppOptions } from './app/MidiSourceApp';
import { ApplicationMode, CLIApplication, CLIApplicationFactory } from './app/CLIApplication';

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
          console.log('Something went wrong...', err);
          reject(err);
        }
        resolve(data);
      },
    );
  });
}

async function main() {
  console.log(await generateAsciiArt());
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
    console.log(options);
  }

  const cliAppFactory: CLIApplicationFactory = new CLIApplicationFactory();
  const cliApp: CLIApplication = cliAppFactory.createApplication(ApplicationMode.MIDI_SOURCE, options);
  await cliApp.run();
}

main();
