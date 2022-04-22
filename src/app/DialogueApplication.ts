import chalk from 'chalk';
import { prompt } from 'enquirer';
import * as OSC from 'node-osc';
import { MusicGenerator } from '../generator/Generator';
import MarkovChainMusicGenerator from '../generator/MarkovChainMusicGenerator';
import { CLIApplication } from './CLIApplication';

export interface DialogueApplicationOptions {
    server_port: number;
    server_hostname: string;
    client_port: number;
    client_hostname: string;
}

export class DialogueApplication implements CLIApplication {
  private constructor(
        private readonly generator: MusicGenerator.Generator,
        private readonly oscServer: OSC.Server,
        private readonly oscClient: OSC.Client,
  ) {}

  public static async createAndInit(): Promise<DialogueApplication> {
    const options: { options: DialogueApplicationOptions } = await prompt<{ options: DialogueApplicationOptions }>({
      type: 'form',
      name: 'options',
      message: 'Please provide the following information',
      choices: [
        { name: 'server_port', message: 'Server Port'},
        { name: 'server_hostname', message: 'Server Hostname'},
        { name: 'client_port', message: 'Client port'},
        { name: 'client_hostname', message: 'Client hostname'},
      ]
    });

    const { server_port, server_hostname, client_port, client_hostname} = options.options;
    const generator: MusicGenerator.Generator = new MarkovChainMusicGenerator(10, 2);
    const oscClient: OSC.Client = new OSC.Client(client_hostname, client_port);
    const oscServer: OSC.Server = new OSC.Server(
      server_port, 
      server_hostname, 
      () => console.log(chalk.whiteBright(`OSC Server is listening at port ${server_port}. Press CTRL + C to quit.`))
    );
    return new DialogueApplication(generator, oscServer, oscClient);
  }

  private setupOsc(): void {
    this.oscServer.on('/gen/sequence', (message: any) => {
      console.log(chalk.white(`OSC message received: ${message}`));
      const [_, msg] = message;
      
      const sequence : MusicGenerator.Sequence = {
        notes: JSON.parse(msg),
        tempo: { bpm: 120 },
        quantization: { stepsPerQuater: 1 },
      };

      const genSequence : MusicGenerator.Sequence = this.generator.generate(sequence);

      const [notes, steps] : [number[], number[]] = [[], []];
      genSequence.notes.forEach(([note, step]) => {
        notes.push(note);
        steps.push(step);
      });

      this.oscClient.send(new OSC.Message('/gen/sequence', ...notes));
      this.oscClient.send(new OSC.Message('/gen/steps', ...steps));
    });
  }

  public async run(): Promise<void> {
    this.setupOsc();
  }
}
