module Types
import Data.Fin
import Data.Vect
import Data.Buffer


{-- MIDI representation as per Standard MIDI Files 1.0 Specification --}

namespace Midi
  Note : Type
  Note = Fin 128

  Velocity : Type
  Velocity = Fin 128

  Pressure : Type
  Pressure = Fin 128

  Preset : Type
  Preset = Fin 128

  Channel : Type
  Channel = Fin 16

  Ticks : Type
  Ticks = Integer

  data FileFormat = SingleTrack | MultiTrackSync | MultiTrackAsync

  data Message = NoteOn            Channel Note    Velocity
               | NoteOff           Channel Note    Velocity
               | KeyPressure       Channel Note    Pressure
               | ControllerChange  Channel Integer Integer
               | ProgramChange     Channel Preset
               | ChannelPressure   Channel Pressure
               | PitchBend         Channel Integer
               -- Meta Messages
               | SequenceNumber    Integer
               | Text              String
               | Copyright         String
               | TrackName         String
               | InstrumentName    String
               | Lyrics            String
               | Marker            String
               | CuePoint          String
               | ChannelPrefix     Integer
               | Tempo             Integer
               | EndOfTrack
               | SMPTEOffset       Integer Integer Integer Integer Integer
               | TimeSignature     Integer Integer Integer Integer
               | KeySignature      Integer Integer
               | SequencerSpecific Buffer
               -- System Exclusive Message
               | SysEx             Integer Buffer -- F0 or F7
                           
  data TimeDivision = TicksPerBeat   Ticks
                    | TicksPerSecond Integer Ticks -- SMPTE and MIDI time code

  Event : Type
  Event = (Ticks, Message)

  Track : Type
  Track = List Event

  record MidiFile where
    constructor MkMidiFile
    format      : FileFormat
    ntrks       : Nat
    tracks      : Vect ntrks Track
    division    : TimeDivision

