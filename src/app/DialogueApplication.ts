import chalk from 'chalk';
import { prompt } from 'enquirer';
import * as OSC from 'node-osc';
import TypeGuards from '../common/TypeGuards';
import UnreachableCode from '../common/UnreachableCode';
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
        { name: 'Markov Chain' },
        { name: 'Magenta MusicRNN' },
      ],
    });

    const generatorType: MusicGenerator.GeneratorType = MusicGenerator.GeneratorType[
      Object.keys(MusicGenerator.GeneratorType).find(
        (k) => MusicGenerator.GeneratorType[k as MusicGenerator.GeneratorTypeKey] === type,
      ) as MusicGenerator.GeneratorTypeKey
    ];

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
          { name: 'chordProgression', message: 'Chord progression the sequence should be based on (comma-separated)' },
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
      validate: (value) => {
        const opts = (value as unknown) as MusicGenerator.GeneratorOptions;
        if (TypeGuards.isMarkovChainMusicGeneratorOptions(opts)) {
          const { order, steps } = opts;
          if (
            Number.isNaN(Number(order)) ||
            !Number.isInteger(Number(order)) ||
            Number.isNaN(Number(steps)) ||
            !Number.isInteger(Number(steps))
          ) {
            return 'Markov Chain Music Generator options order and steps must be integers!';
          }
        }
        if (TypeGuards.isMagentaMusicGeneratorOptions(opts)) {
          const { temperature, steps } = opts;
          if (
            Number.isNaN(Number(temperature)) ||
            Number.isNaN(Number.parseFloat(temperature.toString())) ||
            Number.isNaN(Number(steps)) ||
            !Number.isInteger(Number(steps))
          ) {
            return 'Magenta MusicRNN Music Generator options temperature and steps must be numbers!';
          }
        }
        return true;
      },
    });

    const generator: MusicGenerator.Generator =
      await MusicGenerator.GeneratorFactory.createGenerator(generatorType, genOptions.options);
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

      const {
        notes,
        quantization: { stepsPerQuarter },
      } : MusicGenerator.Sequence = await this.generator.generate(sequence);

      const pitches: number[] = notes.reduce((acc, [pitch, _]) => [...acc, pitch], []);
      const steps: number[] = notes.reduce((acc, [_, qs]) => [...acc, qs / stepsPerQuarter], []);

      this.oscClient.send(new OSC.Message('/gen/sequence', ...pitches));
      this.oscClient.send(new OSC.Message('/gen/steps', ...steps));
    });
  }

  public async run(): Promise<void> {
    this.setupOsc();
  }
}
