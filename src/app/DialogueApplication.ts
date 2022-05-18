import chalk from 'chalk';
import { prompt } from 'enquirer';
import * as OSC from 'node-osc';
import { MusicGenerator } from '../generator/Generator';
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
        { name: 'server_port', message: 'Server Port' },
        { name: 'server_hostname', message: 'Server Hostname' },
        { name: 'client_port', message: 'Client port' },
        { name: 'client_hostname', message: 'Client hostname' },
      ],
    });

    const { type } = await prompt<{ type: string }>({
      type: 'select',
      name: 'type',
      message: 'Choose generator type',
      choices: [
        { name: 'Markov Chain', value: '0' },
        { name: 'Magenta MusicRNN', value: '1' },
      ],
      result() {
        return (this as any).focused.value;
      },
    });

    const generatorType: MusicGenerator.GeneratorType = [
      MusicGenerator.GeneratorType.MARKOV_CHAIN,
      MusicGenerator.GeneratorType.MAGNETA_MUSIC_RNN,
    ][Number(type)];

    let genChoices;

    switch (generatorType) {
      case MusicGenerator.GeneratorType.MARKOV_CHAIN:
        genChoices = [
          { name: 'order', message: 'The order of the Markov chain' },
          { name: 'steps', message: 'Number of steps to be generated' },
        ];
        break;
      case MusicGenerator.GeneratorType.MAGNETA_MUSIC_RNN:
        genChoices = [
          { name: 'steps', message: 'Number of steps to be generated' },
          { name: 'temperature', message: 'The temparature of the MusicRNN' },
          { name: 'chordProgression', message: 'Chord progression the sequence should be based on' },
        ];
        break;
    }

    const genOptions: { options: MusicGenerator.GeneratorOptions } = await prompt<{options: MusicGenerator.GeneratorOptions}>({
      type: 'form',
      name: 'options',
      message: 'Provide generator options',
      choices: genChoices,
    });

    const {
      server_port, server_hostname, client_port, client_hostname,
    } = options.options;
    const generatorFactory: MusicGenerator.GeneratorFactory = new MusicGenerator.GeneratorFactory();
    const generator: MusicGenerator.Generator = await generatorFactory.createGenerator(generatorType, genOptions.options);
    const oscClient: OSC.Client = new OSC.Client(client_hostname, client_port);
    const oscServer: OSC.Server = new OSC.Server(
      server_port,
      server_hostname,
      () => console.log(chalk.whiteBright(`OSC Server is listening at port ${server_port}. Press CTRL + C to quit.`)),
    );
    return new DialogueApplication(generator, oscServer, oscClient);
  }

  private setupOsc(): void {
    this.oscServer.on('/gen/sequence', async (message: any) => {
      console.log(chalk.white(`OSC message received: ${message}`));
      const [_, msg] = message;

      const sequence : MusicGenerator.Sequence = {
        notes: JSON.parse(msg),
        tempo: { bpm: 120 },
        quantization: { stepsPerQuarter: 1 },
      };

      const genSequence : MusicGenerator.Sequence = await this.generator.generate(sequence);

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
