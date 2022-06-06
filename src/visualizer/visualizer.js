/**
 * P5.js Visualizer script.
 */
const MIN_STEP = 0.5;

function receiveOsc(address, value) {
  console.log(`received OSC: ${address}, ${value}`);

  if (address === '/visualize') {
    const sequences = JSON.parse(value);

    Object.entries(sequences).forEach(([k, sequence]) => {
      document.getElementById('sequencer').appendChild(document.createTextNode(k));

      const [min, max] = sequence.notes.reduce(
        (acc, [pitch, _]) => [Math.min(acc[0], pitch), Math.max(acc[1], pitch)],
        [Infinity, 0],
      );

      const sequencer = Nexus.Add.Sequencer('#sequencer', {
        size: [1000, 100],
        mode: 'toggle',
        rows: max - min + 1,
        columns: Math.ceil(sequence.notes.reduce((acc, [_, qs]) => acc + qs, 0) / MIN_STEP),
      });

      sequence.notes.reduce((step, [pitch, qs]) => {
        [...Array(Math.max(1, qs / MIN_STEP)).keys()].forEach(() => {
          sequencer.matrix.toggle.cell(step++, pitch - min);
        });
        return step;
      }, 0);
    });
  }
}

function setupOsc(oscPortIn, oscPortOut) {
  const socket = io.connect('http://127.0.0.1:8081', { port: 8081, rememberTransport: false });
  socket.on('connect', () => {
    socket.emit('config', {
      server: { port: oscPortIn, host: '127.0.0.1' },
      client: { port: oscPortOut, host: '127.0.0.1' },
    });
  });

  socket.on('message', (msg) => receiveOsc(msg[0], msg.splice(1)));
}

setupOsc(12000, 3334);
