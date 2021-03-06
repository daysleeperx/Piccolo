import midiConverter from 'midi-converter';
import TypeGuards from '../common/TypeGuards';
import { Midi } from './Parser';

export default class MidiBuilder implements Midi.Builder {
  build(midi: Midi.MidiFile): Buffer {
    const {
      format, ntrks, division, tracks,
    } = midi;

    const midiSong = midiConverter.jsonToMidi({
      header: {
        formatType: format,
        trackCount: ntrks,
        ticksPerBeat: (division as Midi.TicksPerBeat).ticksPerBeat,
      },
      tracks: tracks.map((trk: Midi.Track) => trk
        .filter(([_, msg]: Midi.Event) => TypeGuards.isNoteMessage(msg))
        .map(([ticks, msg]: Midi.Event, idx: number) => ({
          deltaTime: (idx % 2 === 0) ? 0 : ticks,
          channel: 0,
          type: 'channel',
          subtype: (idx % 2 === 0) ? 'noteOn' : 'noteOff',
          noteNumber: (msg as Midi.NoteOn | Midi.NoteOff).note,
          velocity: 67,
        }))),
    });

    return Buffer.from(midiSong, 'binary');
  }
}
