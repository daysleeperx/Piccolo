import * as OSC from 'node-osc';
import { Presets, SingleBar } from 'cli-progress';
import { prompt } from 'enquirer';
import Utils from '../common/Utils';
import { MusicGenerator } from '../generator/Generator';
import { Midi } from '../parser/Parser';
import { MidiApplication, MidiSourceAppOptions } from './MidiApplication';
import MidiBuilder from '../parser/MidiBuilder';
import { MidiParser } from '../parser/MidiParser';

export class SequentialApplication extends MidiApplication {
  private constructor(
    parser: Midi.Parser,
    builder: Midi.Builder,
    generator: MusicGenerator.Generator,
    oscClient: OSC.Client,
    options: MidiSourceAppOptions,
  ) {
    super(parser, builder, generator, oscClient, options);
  }

  public static override async createAndInit(): Promise<SequentialApplication> {
    const options: {options: MidiSourceAppOptions} = await prompt<{options: MidiSourceAppOptions}>({
      type: 'form',
      name: 'options',
      message: 'Please provide the following information',
      choices: [
        { name: 'source', message: 'Source' },
        { name: 'out', message: 'Out' },
        { name: 'outputs', message: 'No. of outputs' },
        { name: 'name', message: 'Name of output file' },
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

    const parser: Midi.Parser = new MidiParser();
    const builder: Midi.Builder = new MidiBuilder();
    const generatorFactory: MusicGenerator.GeneratorFactory = new MusicGenerator.GeneratorFactory();
    const generator: MusicGenerator.Generator = await generatorFactory.createGenerator(generatorType, genOptions.options);
    const oscClient: OSC.Client = new OSC.Client('localhost', 4560);
    return new SequentialApplication(parser, builder, generator, oscClient, options.options);
  }

  override async sendOSCMessage(): Promise<void> {
    const { notes, quantization: { stepsPerQuarter } } = this.currentSequence;

    const bar = new SingleBar({}, Presets.shades_classic);
    bar.start(notes.length, 0);

    /* eslint-disable-next-line no-restricted-syntax */
    for (const [idx, [pitch, quantizedSteps]] of notes.entries()) {
      this.oscClient.send(['melody/notes', pitch]);
      /* eslint-disable-next-line no-await-in-loop */
      await Utils.sleep((quantizedSteps / stepsPerQuarter) * 1000);
      bar.update(idx + 1);
    }

    bar.stop();
  }
}
