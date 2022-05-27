import { MusicGenerator } from "../src/generator/Generator";
import path from 'path';
import { readFileSync } from 'fs';
import MidiParser from "../src/parser/MidiParser";
import { Midi } from "../src/parser/Parser";
import Utils from "../src/common/Utils";
import { getWeightedRandomKey, transitionGraph } from "../src/generator/MarkovChainMusicGenerator";

describe('Markov Chains Music Generator Tests', () => {
    const parser: Midi.Parser = new MidiParser();
    let generator: MusicGenerator.Generator;

    beforeEach(() => {
        jest.spyOn(global.Math, 'random').mockReturnValue(0.5);
    });
    
    afterEach(() => {
        jest.spyOn(global.Math, 'random').mockRestore();
    });

    test('invention no.2 - 1st order markov chain', async () => {
        const buffer = readFileSync(path.join(__dirname, './data/invent2.midi'));
        generator = await MusicGenerator.GeneratorFactory.createGenerator(MusicGenerator.GeneratorType.MARKOV_CHAIN, { steps: 10, order: 1});

        const { division, tracks } = parser.parse(buffer);

        const sequence: MusicGenerator.Sequence = Utils.extractSequenceFromTrack(tracks[1], { value: 120}, division);
        
        const generatedSequence: MusicGenerator.Sequence = await generator.generate(sequence);

        console.log(generatedSequence);
        expect(generatedSequence.notes.length).toBe(10);
        expect(generatedSequence).toMatchObject({
            quantization: { stepsPerQuarter: 240 },
            tempo: { bpm: 120 },
            notes: [
              [ 72, 180 ], [ 78, 60 ],
              [ 81, 60 ],  [ 72, 60 ],
              [ 75, 60 ],  [ 74, 60 ],
              [ 72, 60 ],  [ 75, 60 ],
              [ 74, 60 ],  [ 72, 60 ]
            ]
        });
    });

    test('invention no.2 - 2nd order markov chain', async () => {
        const buffer = readFileSync(path.join(__dirname, './data/invent2.midi'));
        generator = await MusicGenerator.GeneratorFactory.createGenerator(MusicGenerator.GeneratorType.MARKOV_CHAIN, { steps: 10, order: 2});

        const { division, tracks } = parser.parse(buffer);

        const sequence: MusicGenerator.Sequence = Utils.extractSequenceFromTrack(tracks[1], { value: 120}, division);
        
        const generatedSequence: MusicGenerator.Sequence = await generator.generate(sequence);

        console.log(generatedSequence);
        expect(generatedSequence.notes.length).toBe(10);
        expect(generatedSequence).toMatchObject({
            quantization: { stepsPerQuarter: 240 },
            tempo: { bpm: 120 },
            notes: [
              [ 79, 60 ], [ 78, 60 ],
              [ 81, 60 ], [ 72, 60 ],
              [ 70, 60 ], [ 72, 180 ],
              [ 78, 60 ], [ 76, 60 ],
              [ 74, 60 ], [ 82, 180 ]
            ]
        });
    });

    test('invention no.2 - 3rd order markov chain', async () => {
        const buffer = readFileSync(path.join(__dirname, './data/invent2.midi'));
        generator = await MusicGenerator.GeneratorFactory.createGenerator(MusicGenerator.GeneratorType.MARKOV_CHAIN, { steps: 10, order: 3});

        const { division, tracks } = parser.parse(buffer);

        const sequence: MusicGenerator.Sequence = Utils.extractSequenceFromTrack(tracks[1], { value: 120}, division);
        
        const generatedSequence: MusicGenerator.Sequence = await generator.generate(sequence);

        console.log(generatedSequence);
        expect(generatedSequence.notes.length).toBe(10);
        expect(generatedSequence).toMatchObject({
        quantization: { stepsPerQuarter: 240 },
            tempo: { bpm: 120 },
            notes: [
                [ 81, 60 ], [ 72, 60 ],
                [ 70, 60 ], [ 72, 180 ],
                [ 78, 60 ], [ 76, 60 ],
                [ 74, 60 ], [ 82, 180 ],
                [ 76, 60 ], [ 78, 180 ]
            ]
        });
    });

    test('weighted random key - should return key with 4 transitions', () => {
        expect(getWeightedRandomKey(new Map([
            ['60:480', 2],
            ['62:960', 4],
            ['65:1920', 2],
        ]))).toBe('62:960');
    });

    test('weighted random key - should return key with 6 transitions', () => {
        expect(getWeightedRandomKey(new Map([
            ['67:960', 6],
            ['65:960', 4],
            
        ]))).toBe('67:960');
    });

    test('weighted random key - should return key with 2 transitions', () => {
        expect(getWeightedRandomKey(new Map([
            ['60:2', 2],
            ['69:4', 1],
            ['67:4', 1],
            
        ]))).toBe('60:2');
    });

    test('transition matrix - 1st order markov chain', () => {
        expect(transitionGraph([
            [72, 60],
            [72, 60],
            [70, 240],
            [81, 180],
            [72, 60],
            [69, 480]
        ], 1)).toEqual(new Map([
            ['72:60', new Map([['72:60', 1], ['69:480', 1], ['70:240', 1]])],
            ['70:240', new Map([['81:180', 1]])],
            ['81:180', new Map([['72:60', 1]])],
        ]));
    });

    test('transition matrix - 2nd order markov chain', () => {
        expect(transitionGraph([
            [72, 60],
            [72, 60],
            [70, 240],
            [81, 180],
            [72, 60],
            [69, 480]
        ], 2)).toEqual(new Map([
            ['72:60->72:60', new Map([['70:240', 1]])],
            ['72:60->70:240', new Map([['81:180', 1]])],
            ['70:240->81:180', new Map([['72:60', 1]])],
            ['81:180->72:60', new Map([['69:480', 1]])]
        ]));
    });

    test('transition matrix - 3rd order markov chain', () => {
        expect(transitionGraph([
            [72, 60],
            [72, 60],
            [70, 240],
            [81, 180],
            [72, 60],
            [69, 480]
        ], 3)).toEqual(new Map([
            ['72:60->72:60->70:240', new Map([['81:180', 1]])],
            ['72:60->70:240->81:180', new Map([['72:60', 1]])],
            ['70:240->81:180->72:60', new Map([['69:480', 1]])],
        ]));
    });
});

describe('Magenta MusicRNN Generator Tests', () => {
    const parser: Midi.Parser = new MidiParser();
    let generator: MusicGenerator.Generator;

    test('twinkle twinkle - magenta rnn', async () => {
        const buffer = readFileSync(path.join(__dirname, './data/twinkle_twinkle.midi'));
        generator = await MusicGenerator.GeneratorFactory.createGenerator(MusicGenerator.GeneratorType.MAGNETA_MUSIC_RNN, { steps: 100, temperature: 1, chordProgression: 'E,A,C'});

        const { tracks, division } = parser.parse(buffer);
        const sequence: MusicGenerator.Sequence = Utils.extractSequenceFromTrack(tracks[1], { value: 120}, division);
        const generatedSequence: MusicGenerator.Sequence = await generator.generate(sequence);

        console.log(generatedSequence);
        expect(generatedSequence.notes.length).toBeGreaterThan(0);
    });
});