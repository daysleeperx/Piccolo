import { prompt } from 'enquirer';
import figlet from 'figlet';
import { ApplicationMode, CLIApplication, CLIApplicationFactory } from './app/CLIApplication';

async function generateAsciiArt() {
  return new Promise((resolve, reject) => {
    figlet.text(
      'Piccolo',
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

  const { mode } = await prompt<{ mode: string }>({
    type: 'select',
    name: 'mode',
    message: 'Choose application mode',
    choices: [
      { name: 'MIDI' },
      { name: 'DIALOGUE' },
      { name: 'SEQUENTIAL' },
    ],
  });

  const applicationMode: ApplicationMode = ApplicationMode[
    Object.keys(ApplicationMode).find(
      (k) => ApplicationMode[k as keyof typeof ApplicationMode] === mode,
    ) as keyof typeof ApplicationMode
  ];

  const cliApp: CLIApplication = await CLIApplicationFactory.createApplication(applicationMode);
  await cliApp.run();
}

main();
