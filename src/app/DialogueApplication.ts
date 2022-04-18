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

  public static createAndInit(options: DialogueApplicationOptions): DialogueApplication {
    const {
      server_port, server_hostname, client_port, client_hostname,
    } = options;
    const generator: MusicGenerator.Generator = new MarkovChainMusicGenerator(100, 2);
    const oscClient: OSC.Client = new OSC.Client(client_hostname, client_port);
    const oscServer: OSC.Server = new OSC.Server(server_port, server_hostname);
    return new DialogueApplication(generator, oscServer, oscClient);
  }

  private generateSequence(message: any): void {
    const sequence : MusicGenerator.Sequence = {
      notes: JSON.parse(message.args[0]),
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
  }

  private setupOsc(): void {
    this.oscServer.on('/gen/sequence', this.generateSequence);
  }

  public async run(): Promise<void> {
    this.setupOsc();
  }
}
