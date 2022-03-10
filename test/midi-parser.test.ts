import { MidiParser } from "../src/parser/MidiParser";
import { readFileSync } from 'fs';
import path from 'path';
import { Midi } from "../src/parser/Parser";


describe("Midi Parser tests", () => {
    const parser: Midi.Parser = new MidiParser();

    test("parse midi file with single track", () => {
        const buffer = readFileSync(path.join(__dirname, './data/chpn_op10_e01_format0.midi'));
        
        const { format, ntrks, tracks } = parser.parse(buffer);
        
        expect(format).toEqual(Midi.FileFormat.SINGLE_TRACK);
        expect(ntrks).toEqual(1);
        expect(tracks.length).toEqual(1);
    });

    test("parse midi file with 3 tracks", () => {
        const buffer = readFileSync(path.join(__dirname, './data/invent2.midi'));

        const { format, ntrks, tracks } = parser.parse(buffer);

        expect(format).toEqual(Midi.FileFormat.MULTI_TRACK_SYNC);
        expect(ntrks).toEqual(3);
        expect(tracks.length).toEqual(3);
    });
});