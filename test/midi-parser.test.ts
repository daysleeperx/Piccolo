import { MidiParser } from "../src/parser/MidiParser";
import { readFileSync } from 'fs';
import path from 'path';
import { Midi } from "../src/parser/Parser";
import MidiBuilder from "../src/parser/MidiBuilder";


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

describe("Midi Builder tests", () => {
    const builder: Midi.Builder = new MidiBuilder();

    test("build midi file", () => {
        const midiFile: Midi.MidiFile = {
            format: Midi.FileFormat.SINGLE_TRACK,
            ntrks: 1,
            tracks: [
                [ 
                    [0, { channel: 0, note: 72, velocity: 67}],
                    [90, { channel: 0, note: 72, velocity: 0}],
                    [0, { channel: 0, note: 74, velocity: 67}],
                    [60, { channel: 0, note: 72, velocity: 67}]
                ]
            ],
            division: { ticksPerBeat: 72 }
        };

        const buffer: Buffer = builder.build(midiFile);
        const data: DataView = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);

        expect([
            data.getUint8(0), 
            data.getUint8(1), 
            data.getUint8(2), 
            data.getUint8(3)
        ]).toEqual([0x4D, 0x54, 0x68, 0x64]);
        expect(data.getUint8(9)).toEqual(midiFile.format);
        expect(data.getUint8(11)).toEqual(midiFile.ntrks);
    });
});