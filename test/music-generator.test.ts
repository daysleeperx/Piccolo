import { MusicGenerator } from "../src/generator/Generator";
import path from 'path';
import { readFileSync } from 'fs';
import MidiParser from "../src/parser/MidiParser";
import { Midi } from "../src/parser/Parser";
import Utils from "../src/common/Utils";

describe('Markov Chains Music Generator Tests', () => {
    const parser: Midi.Parser = new MidiParser();
    let generator: MusicGenerator.Generator;

    test('twinkle twinkle - 1st order markov chain', async () => {
        const buffer = readFileSync(path.join(__dirname, './data/twinkle_twinkle.midi'));
        generator = await MusicGenerator.GeneratorFactory.createGenerator(MusicGenerator.GeneratorType.MARKOV_CHAIN, { steps: 10, order: 1});

        const { division, tracks } = parser.parse(buffer);

        const sequence: MusicGenerator.Sequence = Utils.extractSequenceFromTrack(tracks[1], { value: 120}, division);
        const generatedSequence: MusicGenerator.Sequence = await generator.generate(sequence);

        console.log(generatedSequence);
        expect(generatedSequence.notes.length).toBe(10);
    });

    test('twinkle twinkle - magenta rnn', async () => {
        const buffer = readFileSync(path.join(__dirname, './data/twinkle_twinkle.midi'));
        generator = await MusicGenerator.GeneratorFactory.createGenerator(MusicGenerator.GeneratorType.MAGNETA_MUSIC_RNN, { steps: 100, temperature: 1, chordProgression: 'E,A,C'});

        const { tracks, division } = parser.parse(buffer);
        const sequence: MusicGenerator.Sequence = Utils.extractSequenceFromTrack(tracks[1], { value: 120}, division);
        const generatedSequence: MusicGenerator.Sequence = await generator.generate(sequence);

        console.log(generatedSequence);
    });
});