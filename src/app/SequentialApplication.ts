import * as OSC from 'node-osc';
import { Presets, SingleBar } from 'cli-progress';
import { prompt } from 'enquirer';
import Utils from '../common/Utils';
import { MusicGenerator } from '../generator/Generator';
import { Midi } from '../parser/Parser';
import { MidiApplication, MidiSourceAppOptions } from './MidiApplication';
import MarkovChainMusicGenerator from '../generator/MarkovChainMusicGenerator';
import MidiBuilder from '../parser/MidiBuilder';
import { MidiParser } from '../parser/MidiParser';

export class SequentialApplication extends MidiApplication {
    private constructor(
        parser: Midi.Parser,
        builder: Midi.Builder,
        generator: MusicGenerator.Generator,
        oscClient: OSC.Client,
        options: MidiSourceAppOptions
    ) {
        super(parser, builder, generator, oscClient, options)
    }

    public static override async createAndInit(): Promise<SequentialApplication> {
        const options: {options: MidiSourceAppOptions} = await prompt<{options: MidiSourceAppOptions}>({
            type: 'form',
            name: 'options',
            message: 'Please provide the following information',
            choices: [
                { name: 'source', message: 'Source'},
                { name: 'out', message: 'Out'},
                { name: 'outputs', message: 'No. of outputs'},
                { name: 'name', message: 'Name of output file'},
            ]
        });

        const parser: Midi.Parser = new MidiParser();
        const builder: Midi.Builder = new MidiBuilder();
        const generator: MusicGenerator.Generator = new MarkovChainMusicGenerator(100, 3);
        const oscClient: OSC.Client = new OSC.Client('localhost', 4560);
        return new SequentialApplication(parser, builder, generator, oscClient, options.options);
    }

    override async sendOSCMessage(): Promise<void> {
        const { notes, quantization: { stepsPerQuater } } = this.currentSequence;

        const bar = new SingleBar({}, Presets.shades_classic);
        bar.start(notes.length, 0);
    
        /* eslint-disable-next-line no-restricted-syntax */
        for (const [idx, [pitch, quantizedSteps]] of notes.entries()) {
          this.oscClient.send(['melody/notes', pitch]);
          /* eslint-disable-next-line no-await-in-loop */
          await Utils.sleep((quantizedSteps / stepsPerQuater) * 1000);
          bar.update(idx + 1);
        }
    
        bar.stop();
        this.oscClient.close();
    }
}
