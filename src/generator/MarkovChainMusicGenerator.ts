import { MusicGenerator } from "./Generator";
import { Midi } from "./Parser"
import { keyToNote, extractSequenceFromTrack } from "./Utils";

type TransitionMatrix = Map<string, Map<string, number>>;

export class MarkovChainMusicGenerator implements MusicGenerator.Generator {
    constructor(
        private readonly midiParser: Midi.Parser,
        private readonly midiBuilder: Midi.Builder
    ) {}

    public generate(input: string | Buffer): string | Buffer {
        if (typeof input === "string") {
            throw new Error("Method not implemented!");
        }

        const midiFile: Midi.MidiFile = this.midiParser.parse(input);
        const { format, tracks, division } = midiFile;

        if (format !== Midi.FileFormat.SINGLE_TRACK) {
            throw new Error("Invalid MIDI File Format!");
        }

        const { notes }: MusicGenerator.Sequence = extractSequenceFromTrack(tracks[0], {value: 120}, division);
        const transitions: TransitionMatrix = this.transitionMatrix(notes, 3);
        const seed: MusicGenerator.Note[] = this.getRandomSeqKey(transitions).split("->").map(keyToNote);
        const generatedSequence: MusicGenerator.Note[] = [...this.generateSequence(seed, transitions, 100)];
        console.log(generatedSequence);

        return this.midiBuilder.build(midiFile);
    }

    private transitionMatrix(notes: MusicGenerator.Note[], order: number): TransitionMatrix {
        return notes
            .slice(order)
            .map((note: MusicGenerator.Note, idx: number) => [note, notes.slice(idx, idx + order)])
            .reduce((acc, [curr, prev]) => {
                const [nextPitch, nextDuration] = curr;
                const seqKey: string = (prev as MusicGenerator.Note[]).map<string>(([pitch, duration]) => `${pitch}:${duration}`).join("->"); 
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

    private getRandomSeqKey(matrix: Map<string, any>): string {
        return [...matrix.keys()][Math.floor(Math.random() * matrix.size)];
    }
    
    private *generateSequence(current: MusicGenerator.Note[], transtions: TransitionMatrix, step: number): Generator<MusicGenerator.Note> {
        let next: MusicGenerator.Note[];
    
        if (step === 0) {
            return;
        }
    
        const seqKey: string = current.map<string>(([pitch, duration]) => `${pitch}:${duration}`).join("->");
        if (transtions.has(seqKey)) {
            const nextNote = keyToNote(this.getRandomSeqKey(transtions.get(seqKey)));
            next = [...current.slice(1), nextNote];
        } else {
            next = this.getRandomSeqKey(transtions).split("->").map(keyToNote);
        }
    
        yield next[next.length - 1];
        yield *this.generateSequence(next, transtions, step - 1);
    }
}