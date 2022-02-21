export namespace Midi {
    /**
     * MIDI representation as per Standard MIDI Files 1.0 Specification.
     */
    export type Note = number;
    export type Velocity = number;
    export type Pressure = number;
    export type Preset = number;
    export type Channel = number;
    export type Ticks = number;

    export enum FileFormat {
        SINGLE_TRACK,
        MULTI_TRACK_SYNC,
        MULTI_TRACK_ASYNC
    }

    interface ChannelMessage {
        channel: Channel;
    }

    export interface NoteOn extends ChannelMessage {
        note: Note;
        velocity: Velocity;
    }

    export interface NoteOff extends ChannelMessage {
        note: Note;
        velocity: Velocity;
    }

    export interface KeyPressure extends ChannelMessage {
        note: Note;
        pressure: Pressure;
    }

    export interface ControllerChange extends ChannelMessage {
        controller: number;
        value: number;
    }
    
    export interface ProgramChange extends ChannelMessage {
        preset: Preset;
    }

    export interface ChannelPressure extends ChannelMessage {
        pressure: Pressure;
    }

    export interface PitchBend extends ChannelMessage {
        value: number;
    }

    export interface SequenceNumber {
        value: number;
    }

    export interface Text {
        text: string;
    }

    export interface Copyright {
        value: string;
    }

    export interface TrackName {
        name: string;
    }

    export interface InstrumentName {
        name: string;
    }

    export interface Lyrics {
        value: string;
    }

    export interface Marker {
        value: string;
    }

    export interface CuePoint {
        value: string;
    }

    export interface ChannelPrefix {
        value: number;
    }

    export interface Tempo {
        value: number;
    }
    
    export interface EndOfTrack {}

    export interface SMPTEOffset {
        hour: number;
        minute: number;
        second: number;
        frame: number;
        fractionalFrames: number;
    }

    export interface TimeSignature {
        numerator: number;   
        denominator: number;   
        clocks: number;   
        bb: number;  // TODO: find better name  
    }

    export interface KeySignature {
        sf: number;
        minor: boolean;
    }

    export interface SequencerSpecific {
        data: any;
    }

    export interface SysEx {
        code: 240 | 247; // F0 or F7
        data: any;                
    }

    export type Message = 
            | NoteOn
            | NoteOff
            | KeyPressure
            | ControllerChange
            | ProgramChange
            | ChannelPressure
            | PitchBend
            | SequenceNumber
            | Text
            | Copyright
            | TrackName
            | InstrumentName
            | Lyrics
            | Marker
            | CuePoint
            | ChannelPrefix
            | Tempo
            | EndOfTrack
            | SMPTEOffset
            | TimeSignature
            | KeySignature
            | SequencerSpecific
            | SysEx;

    
    export interface TicksPerBeat {
        ticksPerBeat: Ticks;
    }

    export interface TicksPerSecond {
        format: number;
        ticksPerFrame: Ticks;
    }

    export type TimeDivision = TicksPerBeat | TicksPerSecond;

    export type Event = [ticks: Ticks, message: Message];
    export type Track = Event[];

    export interface MidiFile {
        format: FileFormat;
        ntrks: number;
        tracks: Track[];
        division: TimeDivision;
    }

    export type Sequence = [NoteOn, NoteOff][];

    export interface Parser {
        /**
         * MIDI Parser interface.
         * @param {Buffer} file MIDI input file
         */
        parse(file: Buffer): MidiFile;
    }

    export interface Builder {
        /**
         * MIDI Builder interface.
         * @param {MidiFile} midi MidiFile object 
         */
        build(midi: MidiFile): Buffer;
    }
}