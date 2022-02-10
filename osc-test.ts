const dgram = require('dgram');
const OSC = require('osc-js');

function* randomNotes(): Generator<number> {
    while (true) {
        yield Math.floor(Math.random() * 127);
    }
}

const socket = dgram.createSocket('udp4');
const gen = randomNotes();

setInterval(() => {
    const { value } = gen.next();

    const message = new OSC.Message('/trigger/prophet', value, 100, 8);
    const binary = message.pack();
    console.log("Sending OSC: ", message);
    
    socket.send(Buffer.from(binary), 0, binary.byteLength, 4560, 'localhost');
}, 1000);