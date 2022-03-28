import { MusicGenerator } from '../generator/Generator';
import { Midi } from '../parser/Parser';

export const { log } = console;

export async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const keyToNote = (seqKey: string) : MusicGenerator.Note => seqKey.split(':').map(Number) as MusicGenerator.Note;
export const eventsToNote = ([_ticks, msg] : Midi.Event, [ticks, _msg] : Midi.Event) : MusicGenerator.Note => [(msg as Midi.NoteOn).note, ticks];

export function isNoteMessage(msg: Midi.Message): msg is Midi.NoteOn | Midi.NoteOff {
  return (msg as Midi.NoteOn | Midi.NoteOff).note !== undefined
            && (msg as Midi.NoteOn | Midi.NoteOff).velocity !== undefined;
}

export function extractSequenceFromTrack(track: Midi.Track, tempo: Midi.Tempo, division: Midi.TimeDivision): MusicGenerator.Sequence {
  return {
    notes: track
      .filter(([_, msg]: Midi.Event) => isNoteMessage(msg))
      .map((e: Midi.Event, idx: number, xs: Midi.Event[]) => idx % 2 === 0 && eventsToNote(e, xs[idx + 1]))
      .filter((x: MusicGenerator.Note) => x),
    quantization: {
      stepsPerQuater: (division as Midi.TicksPerBeat).ticksPerBeat,
    },
    tempo: {
      bpm: tempo.value,
    },
  };
}

export function sequenceToMidiTrack(sequence: MusicGenerator.Sequence): Midi.Track {
  return sequence.notes.flatMap(([pitch, steps]) => [
    [0,
      {
        channel: 0,
        note: pitch,
        velocity: 67, // TODO: remove default velocity
      },
    ],
    [steps,
      {
        channel: 0,
        note: pitch,
        velocity: 67, // TODO: remove default velocity
      },
    ],
  ]);
}