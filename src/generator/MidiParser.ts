import { Midi } from "./Parser";
import { readFileSync } from 'fs';
import path from 'path';
const midiParser  = require('midi-parser-js');

export class MidiParser implements Midi.Parser {
    parse(file: Buffer): Midi.MidiFile {
        const midiArray = midiParser.parse(file);
        console.log(midiArray);
        midiArray.track[1].event.forEach(e => console.log(e));
        return {
            format: Midi.FileFormat.SINGLE_TRACK,
            division: {
                ticksPerBeat: 120
            },
            tracks: []
        }
    }
}

function main() {
    const [file] = process.argv.slice(2);
    const buffer = readFileSync(path.join(__dirname, file));
    const parser: Midi.Parser = new MidiParser();
    parser.parse(buffer);
}

main();