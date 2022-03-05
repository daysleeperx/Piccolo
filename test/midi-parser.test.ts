import { MidiParser } from "../src/parser/MidiParser";
import { readFileSync } from 'fs';
import path from 'path';
import { Midi } from "../src/parser/Parser";


describe("Midi Parser tests", () => {
    const parser: Midi.Parser = new MidiParser();

    test("parse midi file with 3 tracks", () => {
        const buffer = readFileSync(path.join(__dirname, './data/invent2.midi'));

        const { format, ntrks, tracks } = parser.parse(buffer);

        expect(format).toEqual(1);
        expect(ntrks).toEqual(3);
        expect(tracks.length).toEqual(3);
    });
});