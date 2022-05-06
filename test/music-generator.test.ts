import { MusicGenerator } from "../src/generator/Generator";
import path from 'path';
import { readFileSync } from 'fs';
import MarkovChainMusicGenerator from "../src/generator/MarkovChainMusicGenerator";
import { MidiParser } from "../src/parser/MidiParser";
import { Midi } from "../src/parser/Parser";
import Utils from "../src/common/Utils";
import { MagentaMusicRNNGenerator } from "../src/generator/MagentaMusicRNNGenerator";

describe('Markov Chains Music Generator Tests', () => {
    const parser: Midi.Parser = new MidiParser();
    let generator: MusicGenerator.Generator;

    test('twinkle twinkle - 1st order markov chain', async () => {
        const buffer = readFileSync(path.join(__dirname, './data/twinkle_twinkle.midi'));
        generator = new MarkovChainMusicGenerator(10, 1);

        const midiFile = parser.parse(buffer);
        const { format, division, tracks } = midiFile;

        console.log(midiFile);
        console.log(format);
        console.log(division);
        console.log(tracks[1]);

        const sequence: MusicGenerator.Sequence = Utils.extractSequenceFromTrack(tracks[1], { value: 120}, division);
        const generatedSequence: MusicGenerator.Sequence = await generator.generate(sequence);

        console.log(generatedSequence);
        expect(generatedSequence.notes.length).toBe(10);
    });

    test('twinkle twinkle - magenta rnn', async () => {
        const buffer = readFileSync(path.join(__dirname, './data/twinkle_twinkle.midi'));
        generator = await MagentaMusicRNNGenerator.createAndInit();

        const { tracks, division } = parser.parse(buffer);
        const sequence: MusicGenerator.Sequence = Utils.extractSequenceFromTrack(tracks[1], { value: 120}, division);
        const generatedSequence: MusicGenerator.Sequence = await generator.generate(sequence);

        console.log(generatedSequence);
        console.log('I AM HERE');
        expect(generatedSequence.notes.length).toBe(10);
    });
});