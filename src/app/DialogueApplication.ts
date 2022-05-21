import chalk from 'chalk';
import { prompt } from 'enquirer';
import * as OSC from 'node-osc';
import { UnreachableCode } from '../common/UnreachableCode';
import { MusicGenerator } from '../generator/Generator';
import { CLIApplication } from './CLIApplication';

export default class DialogueApplication implements CLIApplication {
  private constructor(
        private readonly generator: MusicGenerator.Generator,
        private readonly oscServer: OSC.Server,
        private readonly oscClient: OSC.Client,
  ) {}

  public static async createAndInit(): Promise<DialogueApplication> {
    const { type } = await prompt<{ type: string }>({
      type: 'select',
      name: 'type',
      message: 'Choose generator type',
      choices: [
        { name: 'Markov Chain', value: '0' },
        { name: 'Magenta MusicRNN', value: '1' },
      ],
      result() {
        /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
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
      default:
        UnreachableCode.never(generatorType);
    }

    const genOptions: { options: MusicGenerator.GeneratorOptions } = await prompt<{
      options: MusicGenerator.GeneratorOptions
    }>({
      type: 'form',
      name: 'options',
      message: 'Provide generator options',
      choices: genChoices,
    });

    const generatorFactory: MusicGenerator.GeneratorFactory = new MusicGenerator.GeneratorFactory();
    const generator: MusicGenerator.Generator = await generatorFactory.createGenerator(
      generatorType,
      genOptions.options,
    );
    const oscClient: OSC.Client = new OSC.Client('localhost', 4560);
    const oscServer: OSC.Server = new OSC.Server(
      9912,
      'localhost',
      () => console.log(chalk.whiteBright('OSC Server is listening at port 9912. Press CTRL + C to quit.')),
    );
    return new DialogueApplication(generator, oscServer, oscClient);
  }

  private setupOsc(): void {
    this.oscServer.on('/gen/sequence', async (message: [string, ...OSC.ArgumentType[]]) => {
      console.log(chalk.white(`OSC message received: ${message}`));
      const [_addr, msg] = message;

      const sequence : MusicGenerator.Sequence = {
        notes: JSON.parse(msg as string),
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
