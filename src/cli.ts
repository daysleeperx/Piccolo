import { prompt } from 'enquirer';
import figlet from 'figlet';
import { Command } from 'commander';
import { MidiSourceAppOptions } from './app/MidiApplication';
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
  let mode = 'MIDI';

  const modes = new Map([
    ['MIDI', ApplicationMode.MIDI],
    ['DIALOGUE', ApplicationMode.DIALOGUE],
    ['SEQUENTIAL', ApplicationMode.SEQUENTIAL],
  ])

  if (Object.keys(program.opts()).length === 0) {
    ({ mode } = await prompt<{ mode: string }>({
      type: 'select',
      name: 'mode',
      message: 'Choose application mode',
      choices: [
        {name: 'MIDI'},
        {name: 'DIALOGUE'},
        {name: 'SEQUENTIAL'}
      ]
    }));
  } else {
    options = program.opts() as MidiSourceAppOptions;
    console.log(options);
  }

  console.log('mode', mode);
  
  const cliAppFactory: CLIApplicationFactory = new CLIApplicationFactory();
  const cliApp: CLIApplication = await cliAppFactory.createApplication(modes.get(mode));
  await cliApp.run();
}

main();
