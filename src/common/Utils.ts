import { MusicGenerator } from '../generator/Generator';
import { Midi } from '../parser/Parser';
import TypeGuards from './TypeGuards';

export default class Utils {
  public static async sleep(ms: number): Promise<void> {
    /* eslint-disable-next-line no-promise-executor-return */
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  public static keyToNote = (seqKey: string) : MusicGenerator.Note => seqKey.split(':').map(Number) as MusicGenerator.Note;

  public static eventsToNote = (
    [_ticks, msg] : Midi.Event,
    [ticks, _msg] : Midi.Event,
  ) : MusicGenerator.Note => [(msg as Midi.NoteOn).note, ticks];

  public static extractSequenceFromTrack(
    track: Midi.Track,
    tempo: Midi.Tempo,
    division: Midi.TimeDivision,
  ): MusicGenerator.Sequence {
    return {
      notes: track
        .filter(([_, msg]: Midi.Event) => TypeGuards.isNoteMessage(msg))
        .map((
          e: Midi.Event,
          idx: number,
          xs: Midi.Event[],
        ) => idx % 2 === 0 && Utils.eventsToNote(e, xs[idx + 1]))
        .filter((x: MusicGenerator.Note) => x),
      quantization: {
        stepsPerQuarter: (division as Midi.TicksPerBeat).ticksPerBeat,
      },
      tempo: {
        bpm: tempo.value,
      },
    };
  }

  public static sequenceToMidiTrack(sequence: MusicGenerator.Sequence): Midi.Track {
    return sequence.notes.flatMap(([pitch, steps]) => [
      [0,
        {
          channel: 0,
          note: pitch,
          velocity: 67,
        },
      ],
      [steps,
        {
          channel: 0,
          note: pitch,
          velocity: 67,
        },
      ],
    ]);
  }

  public static quantizeSequence(sequence: MusicGenerator.Sequence): MusicGenerator.Sequence {
    const { tempo, quantization, notes } : MusicGenerator.Sequence = sequence;
    const grid: number[] = [...Array(7).keys()].map(
      (n) => (quantization.stepsPerQuarter / 4) * (2 ** n),
    );

    return {
      tempo,
      quantization,
      notes: notes
        .map(([pitch, duration]) => [
          pitch,
          grid.reduce((acc, n) => (Math.abs(n - duration) < Math.abs(acc - duration) ? n : acc)),
        ]),
    };
  }
}
