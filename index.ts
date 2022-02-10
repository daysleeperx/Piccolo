import { readFileSync, writeFileSync } from 'fs';
import path from 'path';

var midiConverter = require('midi-converter');
const dgram = require('dgram');
const OSC = require('osc-js');

// test
interface MIDIMessage {
    deltaTime: number,
    channel: number,
    type: string,
    subtype: string,
    noteNumber: number,
    velocity: number
}

type Note = [pitch: number, duration: number];

const msgToNote = ({noteNumber} : MIDIMessage, {deltaTime} : MIDIMessage) : Note => [noteNumber, deltaTime];
const keyToNote = (seqKey: string) : Note => seqKey.split(":").map(Number) as Note;

function transitionMatrix(notes: Note[], order: number): Map<string, Map<string, number>> {
    return notes
        .slice(order)
        .map((note: Note, idx: number) => [note, notes.slice(idx, idx + order)])
        .reduce((acc, [curr, prev]) => {
            const [nextPitch, nextDuration] = curr;
            const seqKey: string = (prev as Note[]).map<string>(([pitch, duration]) => `${pitch}:${duration}`).join("->"); 
            const probs: Map<string, number> = acc.get(seqKey) ?? new Map();
            return acc.set(
                seqKey, 
                probs.set(
                    `${nextPitch}:${nextDuration}`, 
                    (probs.get(`${nextPitch}:${nextDuration}`) ?? 0) + 1
                )
            );
        }, 
        new Map()
    );
}

function getRandomSeqKey(matrix: Map<string, any>): string {
    return [...matrix.keys()][Math.floor(Math.random() * matrix.size)];
}

function* generate(current: Note[], transtions: Map<string, Map<string, number>>, step: number): Generator<Note> {
    let next: Note[];

    if (step === 0) {
        return;
    }

    const seqKey: string = current.map<string>(([pitch, duration]) => `${pitch}:${duration}`).join("->");
    if (transtions.has(seqKey)) {
        const nextNote = keyToNote(getRandomSeqKey(transtions.get(seqKey)));
        next = [...current.slice(1), nextNote];
    } else {
        next = getRandomSeqKey(transtions).split("->").map(keyToNote);
    }

    yield next[next.length - 1];
    yield* generate(next, transtions, step - 1);
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

async function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
    console.time("Generate MIDI");

    const [file, output, order] = process.argv.slice(2);

    const buffer = readFileSync(path.join(__dirname, file), {encoding: 'binary'});
    const { header, tracks } = midiConverter.midiToJson(buffer);

    console.log(header);

    const notes: Note[] = tracks[1]
            .filter(({subtype} : MIDIMessage) => subtype?.startsWith("note"))
            .map((m: MIDIMessage, idx: number, xs: MIDIMessage[]) => idx % 2 === 0 && msgToNote(m, xs[idx + 1]))
            .filter((x: Note) => x);
            
    const transitions: Map<string, Map<string, number>> = transitionMatrix(notes, +order);
    console.log(transitions);
    
    const seed: Note[] = getRandomSeqKey(transitions).split("->").map(keyToNote);
    const generatedNotes = [...generate(seed, transitions, 100)];
    console.log(generatedNotes);

    console.timeEnd("Generate MIDI");

    console.time("Send OSC to Sonic Pi");
    const socket = dgram.createSocket('udp4');

    const { ticksPerBeat } = header;

    for (const [pitch, duration] of generatedNotes) {
        const message = new OSC.Message('/melody/notes', pitch);
        const binary = message.pack();
        console.log("Sending OSC: ", message);
        
        socket.send(Buffer.from(binary), 0, binary.byteLength, 4560, 'localhost');
        await sleep(duration / ticksPerBeat * 1000);
    }
    console.timeEnd("Send OSC to Sonic Pi");
    socket.close();

    const outPutMidi = midiConverter.jsonToMidi({tracks: [notesToMidi(generatedNotes)]});        
    writeFileSync(output, outPutMidi, 'binary');
}

main();
