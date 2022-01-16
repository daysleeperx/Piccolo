import { readFileSync, writeFileSync } from 'fs';
import path from 'path';

var midiConverter = require('midi-converter');

interface MIDIMessage {
    deltaTime: number,
    channel: number,
    type: string,
    subtype: string,
    noteNumber: number,
    velocity: number
}

type Note = [pitch: number, duration: number];

const toNote = ({noteNumber} : MIDIMessage, {deltaTime} : MIDIMessage) : Note => [noteNumber, deltaTime];

function transitionMatrix(notes: Note[]): Map<string, Map<string, number>> {
    return notes
        .slice(1)
        .map((note: Note, idx: number) => [note, notes[idx]])
        .reduce((acc, [curr, prev]) => {
            const [[nextPitch, nextDuration], [pitch, duration]] = [curr, prev];
            const probs: Map<string, number> = acc.get(`${pitch}:${duration}`) ?? new Map();
            return acc.set(
                `${pitch}:${duration}`, 
                probs.set(
                    `${nextPitch}:${nextDuration}`, 
                    (probs.get(`${nextPitch}:${nextDuration}`) ?? 0) + 1
                )
            );
        }, 
        new Map()
    );
}

function *generate(start: Note, transtions: Map<string, Map<string, number>>, steps: number): Generator<Note> {
    let current: Note = start;

    for (const _ of Array(steps).keys()) {
        const [pitch, duration] = current;
        if (transtions.has(`${pitch}:${duration}`)) {
            const probs = transtions.get(`${pitch}:${duration}`);
            current = [...probs.keys()][Math.floor(Math.random() * probs.size)].split(":").map(Number) as Note;
        } else {
            current = [...transtions.keys()][Math.floor(Math.random() * transtions.size)].split(":").map(Number) as Note;
        }
        yield current;
    }
}

function notesToMidi(notes: Note[]): MIDIMessage[] {
    return notes.flatMap(([pitch, duration]) => [{
            deltaTime: 0,
            channel: 0,
            type: "channel",
            subtype: "noteOn",
            noteNumber: pitch,
            velocity: 67
        }, {
            deltaTime: duration,
            channel: 0,
            type: "channel",
            subtype: "noteOff",
            noteNumber: pitch,
            velocity: 67
        }
    ]);
}

async function main() {
    console.time("Generate MIDI");

    const [file, output] = process.argv.slice(2);

    const buffer = readFileSync(path.join(__dirname, file), {encoding: 'binary'});
    const { header, tracks } = midiConverter.midiToJson(buffer);

    console.log(header);

    const notes: Note[] = tracks[1]
            .filter(({subtype} : MIDIMessage) => subtype?.startsWith("note"))
            .map((m: MIDIMessage, idx: number, xs: MIDIMessage[]) => idx % 2 === 0 && toNote(m, xs[idx + 1]))
            .filter((x: Note) => x);
            
    const transitions: Map<string, Map<string, number>> = transitionMatrix(notes);        
    console.log(transitions);
    
    const start: Note = [...transitions.keys()][Math.floor(Math.random() * transitions.size)].split(":").map(Number) as Note;
    const generatedNotes = [...generate(start, transitions, 100)];
    console.log(generatedNotes);

    const outPutMidi = midiConverter.jsonToMidi({tracks: [notesToMidi(generatedNotes)]});        
    writeFileSync(output, outPutMidi, 'binary');

    console.timeEnd("Generate MIDI");
}

main();