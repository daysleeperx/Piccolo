import { Midi } from "./Parser";

export class MidiParser implements Midi.Parser {
    public parse(input: Buffer): Midi.MidiFile {
        if (!(input instanceof Uint8Array)) {
            throw new Error("Invalid input!");
        }
        return this.Uint8(input); 
    }

    private Uint8(FileAsUint8Array: Buffer): Midi.MidiFile {
        let file = {
            data: null,
            pointer: 0,
            movePointer: function(_bytes){                                      // move the pointer negative and positive direction
                this.pointer += _bytes;
                return this.pointer;
            },
            readInt: function(_bytes){                                          // get integer from next _bytes group (big-endian)
                _bytes = Math.min(_bytes, this.data.byteLength-this.pointer);
                if (_bytes < 1) return -1;                                                                      // EOF
                let value = 0;
                if(_bytes > 1){
                    for(let i=1; i<= (_bytes-1); i++){
                        value += this.data.getUint8(this.pointer) * Math.pow(256, (_bytes - i));
                        this.pointer++;
                    }
                }
                value += this.data.getUint8(this.pointer);
                this.pointer++;
                return value;
            },
            readStr: function(_bytes){                                          // read as ASCII chars, the followoing _bytes
                let text = '';
                for(let char=1; char <= _bytes; char++) text +=  String.fromCharCode(this.readInt(1));
                return text;
            },
            readIntVLV: function(){                                             // read a variable length value
                let value = 0;
                if ( this.pointer >= this.data.byteLength ){
                    return -1;                                                  // EOF
                }else if(this.data.getUint8(this.pointer) < 128){               // ...value in a single byte
                    value = this.readInt(1);
                }else{                                                          // ...value in multiple bytes
                    let FirstBytes = [];
                    while(this.data.getUint8(this.pointer) >= 128){
                        FirstBytes.push(this.readInt(1) - 128);
                    }
                    let lastByte  = this.readInt(1);
                    for(let dt = 1; dt <= FirstBytes.length; dt++){
                        value += FirstBytes[FirstBytes.length - dt] * Math.pow(128, dt);
                    }
                    value += lastByte;
                }
                return value;
            }
        };

        const midiFile: Midi.MidiFile = {
            format: undefined,
            ntrks: undefined,
            tracks: [],
            division: undefined,
        };

        file.data = new DataView(FileAsUint8Array.buffer, FileAsUint8Array.byteOffset, FileAsUint8Array.byteLength);                                            // 8 bits bytes file data array
        if (file.readInt(4) !== 0x4D546864) {
            throw new Error('Header validation failed (not MIDI standard or file corrupt.)');
        }

        const _headerSize         = file.readInt(4);
        midiFile.format           = file.readInt(2);
        midiFile.ntrks            = file.readInt(2);
        const timeDivisionByte1   = file.readInt(1);
        const timeDivisionByte2   = file.readInt(1);
        if (timeDivisionByte1 >= 128) {
            midiFile.division = {
                format: timeDivisionByte1 - 128,
                ticksPerFrame: timeDivisionByte2
            }
        } else { 
            midiFile.division = {
                ticksPerBeat: (timeDivisionByte1 * 256) + timeDivisionByte2 
            }
        }

        //  ** read TRACK CHUNK
        for(let t = 1; t <= midiFile.ntrks; t++) {
            midiFile.tracks[t - 1] = []
            let headerValidation = file.readInt(4);
            if (headerValidation === -1) { 
                break; 
            }                               // EOF
            if (headerValidation !== 0x4D54726B) { 
                throw new Error("Invalid Track header!");
            }      
            file.readInt(4);                                                    // move pointer. get chunk size (bytes length)
            let e               = 0;                                            // init event counter
            let endOfTrack      = false;                                        // FLAG for track reading secuence breaking
            // ** read EVENT CHUNK
            let statusByte;
            let laststatusByte;
            while (!endOfTrack) {
                e++;                                                            // increase by 1 event counter
                const deltaTime: number = file.readIntVLV();                    // get DELTA TIME OF MIDI event (Variable Length Value)
                statusByte = file.readInt(1);                                   // read EVENT TYPE (STATUS BYTE)
                if (statusByte === -1) { 
                    break; 
                }                                    // EOF
                else if (statusByte >= 128) { 
                    laststatusByte = statusByte; 
                } else {                                                           // 'RUNNING STATUS' situation detected
                    statusByte = laststatusByte;                                // apply last loop, Status Byte
                    file.movePointer(-1);                                       // move back the pointer (cause readed byte is not status byte)
                }

                //
                // ** IS META EVENT
                //
                if(statusByte === 0xFF) {                                        // Meta Event type
                    const metaType = file.readInt(1);                           // assign metaEvent subtype
                    const metaEventLength = file.readIntVLV();                    // get the metaEvent length
                    switch(metaType) {
                        case 0x2F:                                              // end of track, has no data byte
                        case -1:                                                // EOF
                            midiFile.tracks[t - 1][e - 1] = [deltaTime, {}]
                            endOfTrack = true;                                  // change FLAG to force track reading loop breaking
                            break;
                        case 0x01:                                              // Text Event
                            midiFile.tracks[t - 1][e - 1] = [
                                deltaTime, 
                                {text: file.readStr(metaEventLength)}
                            ];
                            break;
                        case 0x02:                                              // Copyright Notice
                        case 0x05:                                              // Lyrics)
                        case 0x06:                                              // Marker
                        case 0x07:                                              // Cue point                                         // Sequence/Track Name (documentation: http://www.ta7.de/txt/musik/musi0006.htm)
                            midiFile.tracks[t - 1][e - 1] = [
                                deltaTime,
                                {value: file.readStr(metaEventLength)}
                            ];
                            break;
                        case 0x03:                                              // Track name
                        case 0x04:                                              // Instrument Name
                            midiFile.tracks[t - 1][e - 1] = [
                                deltaTime,
                                {name: file.readStr(metaEventLength)}
                            ]
                            break;
                        case 0x20:                                              // Channel Prefix
                        case 0x21:                                              // MIDI PORT
                        case 0x51:                                              // Set Tempo
                        case 0x59:                                              // Key Signature
                            midiFile.tracks[t - 1][e - 1] = [
                                deltaTime,
                                {value: file.readInt(metaEventLength)}
                            ];
                            break;
                        case 0x54:                                              // SMPTE Offset
                            midiFile.tracks[t - 1][e - 1] = [
                                deltaTime,
                                {
                                    hour: file.readInt(1),
                                    minute: file.readInt(1),
                                    second: file.readInt(1),
                                    frame: file.readInt(1),
                                    fractionalFrames: file.readInt(1)
                                }
                            ];
                            break;
                        case 0x58:                                              // Time Signature
                            midiFile.tracks[t - 1][e - 1] = [
                                deltaTime,
                                {
                                    numerator: file.readInt(1),
                                    denominator: file.readInt(1),
                                    clocks: file.readInt(1),
                                    bb: file.readInt(1)
                                }
                            ];
                            break;
                        default :
                            file.readInt(metaEventLength);
                            midiFile.tracks[t - 1][e - 1] = [  
                                deltaTime,
                                {data: file.readInt(metaEventLength)} 
                            ];
                            console.info('Unimplemented 0xFF meta event! data block readed as Integer');
                    }
                }

                //
                // IS REGULAR EVENT
                //
                else {                                                           // MIDI Control Events OR System Exclusive Events
                    statusByte = statusByte.toString(16).split('');             // split the status byte HEX representation, to obtain 4 bits values
                    if(!statusByte[1]) statusByte.unshift('0');                 // force 2 digits
                    const eventType = parseInt(statusByte[0], 16);              // first byte is EVENT TYPE ID
                    const channel = parseInt(statusByte[1], 16);                // second byte is channel
                    switch (eventType) {
                        case 0xF: {                                              // System Exclusive Events
                            const event_length = file.readIntVLV();
                            midiFile.tracks[t - 1][e - 1] = [  
                                deltaTime,
                                {data: file.readInt(event_length)} 
                            ];
                            console.info('Unimplemented 0xF exclusive events! data block readed as Integer');
                            break;
                        }
                        case 0x8:                                               // Note off
                        case 0x9:                                               // Note On
                            midiFile.tracks[t - 1][e - 1] = [
                                deltaTime,
                                {
                                    channel,
                                    note: file.readInt(1),
                                    velocity: file.readInt(1)
                                }
                            ];
                            break;
                        case 0xA:                                               // Note Aftertouch
                            midiFile.tracks[t - 1][e - 1] = [
                                deltaTime,
                                {
                                    channel,
                                    note: file.readInt(1),
                                    pressure: file.readInt(1)
                                }
                            ];
                            break;
                        case 0xB:                                               // Controller
                            midiFile.tracks[t - 1][e - 1] = [
                                deltaTime,
                                {
                                    channel,
                                    controller: file.readInt(1),
                                    value: file.readInt(1)
                                }
                            ];
                            break;
                        case 0xE:                                               // Pitch Bend Event
                            midiFile.tracks[t - 1][e - 1] = [
                                deltaTime,
                                {
                                    channel,
                                    value: file.readInt(2)
                                }
                            ];
                            break;
                        case 0xC:                                              // Program Change
                            midiFile.tracks[t - 1][e - 1] = [
                                deltaTime,
                                {
                                    channel,
                                    preset: file.readInt(1)
                                }
                            ];
                            break;
                        case 0xD:                                               // Channel Aftertouch
                            midiFile.tracks[t - 1][e - 1] = [
                                deltaTime,
                                {
                                    channel,
                                    pressure: file.readInt(1)
                                }
                            ];
                            break;
                        case -1:                                                // EOF
                            endOfTrack = true;                                  // change FLAG to force track reading loop breaking
                            break;
                        default:
                           throw new Error('Unknown EVENT detected... reading cancelled!');
                    }
                }
            }
        }
        return midiFile;
    }
};