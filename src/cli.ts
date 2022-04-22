import { prompt } from 'enquirer';
import figlet from 'figlet';
import { Command } from 'commander';
import { MidiSourceAppOptions } from './app/MidiApplication';
import { ApplicationMode, CLIApplication, CLIApplicationFactory } from './app/CLIApplication';

const modes = [
  ApplicationMode.MIDI, 
  ApplicationMode.DIALOGUE, 
  ApplicationMode.SEQUENTIAL
];

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
  let mode: number = 0;

  if (Object.keys(program.opts()).length === 0) {
    ({ mode } = await prompt<{ mode: number }>({
      type: 'select',
      name: 'mode',
      message: 'Choose application mode',
      choices: [
        {name: 'MIDI', value: '0'},
        {name: 'DIALOGUE', value: '1'},
        {name: 'SEQUENTIAL', value: '2'}
      ],
      result() {
        return (this as any).focused.value;
      }
    }));
  } else {
    options = program.opts() as MidiSourceAppOptions;
    console.log(options);
  }
  
  const cliAppFactory: CLIApplicationFactory = new CLIApplicationFactory();
  const cliApp: CLIApplication = await cliAppFactory.createApplication(modes[Number(mode)]);
  await cliApp.run();
}

main();
