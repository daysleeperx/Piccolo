setupOsc(12000, 3334);

// const demoSequences = new Map([
//   ['./../../midi_out/3/spiegel_test_2_0', {
//     tempo: { bpm: 120 },
//     quantization: { stepsPerQuarter: 0 },
//     notes: [[69.0, 2.0], [65.0, 1.0], [65.0, 1.0], [67.0, 0.5], [69.0, 2.0], [69.0, 2.0], [69.0, 1.0], [67.0, 1.0], [65.0, 1.0], [69.0, 1.0], [65.0, 2.0], [65.0, 1.0], [61.0, 0.5], [65.0, 0.5], [67.0, 0.5], [69.0, 0.5], [74.0, 0.5], [76.0, 0.5], [74.0, 0.5], [76.0, 0.5], [72.0, 0.5], [69.0, 0.5], [65.0, 0.5], [65.0, 0.5]],
//   }],
//   ['./../../midi_out/3/spiegel_test_2_1', {
//     tempo: { bpm: 120 },
//     quantization: { stepsPerQuarter: 0 },
//     notes: [[81.0, 2.0], [79.0, 2.0], [77.0, 1.0], [65.0, 0.5], [67.0, 0.5], [70.0, 0.5], [69.0, 0.5], [67.0, 2.0], [70.0, 1.0], [74.0, 2.0], [65.0, 2.0], [65.0, 1.0], [67.0, 1.0], [70.0, 0.5], [74.0, 1.0], [76.0, 0.5], [76.0, 1.0], [74.0, 0.5], [77.0, 1.0]],
//   }],
//   ['./../../midi_out/3/spiegel_test_2_2', {
//     tempo: { bpm: 120 },
//     quantization: { stepsPerQuarter: 0 },
//     notes: [[69.0, 2.0], [65.0, 1.0], [60.0, 1.0], [62.0, 0.5], [58.0, 2.0], [57.0, 0.5], [60.0, 0.25], [59.0, 0.25], [58.0, 0.5], [57.0, 0.5], [55.0, 1.0], [53.0, 0.25], [60.0, 0.25], [57.0, 0.25], [62.0, 0.25], [64.0, 0.25], [67.0, 0.25], [67.0, 0.25], [69.0, 0.25], [69.0, 0.25], [62.0, 0.25], [65.0, 0.25], [74.0, 0.25], [70.0, 0.25], [74.0, 0.25], [69.0, 0.25], [77.0, 0.25], [74.0, 0.25], [72.0, 0.25], [74.0, 0.25], [76.0, 0.25], [74.0, 0.25], [69.0, 0.25], [74.0, 0.25], [74.0, 0.25], [65.0, 0.25], [65.0, 0.25], [65.0, 0.25], [77.0, 0.25], [79.0, 0.25], [76.0, 0.25], [79.0, 0.25], [81.0, 0.25], [81.0, 0.25], [79.0, 0.25], [76.0, 0.25], [78.0, 0.25], [77.0, 0.25], [76.0, 0.25], [74.0, 0.25], [74.0, 0.25], [72.0, 0.25], [69.0, 0.25], [69.0, 0.25], [72.0, 0.25], [72.0, 0.25]],
//   }],
//   ['./../../midi_out/3/spiegel_test_2_3', {
//     tempo: { bpm: 120 },
//     quantization: { stepsPerQuarter: 0 },
//     notes: [[67.0, 4.0], [67.0, 1.0], [67.0, 0.5], [65.0, 0.5], [65.0, 0.5], [65.0, 0.5], [62.0, 1.0], [65.0, 1.0], [67.0, 2.0], [65.0, 0.5], [67.0, 2.0], [62.0, 1.0], [67.0, 1.0], [67.0, 0.5], [65.0, 1.0], [69.0, 1.0], [65.0, 1.0], [69.0, 1.0]],
//   }],
//   ['./../../midi_out/3/spiegel_test_2_4', {
//     tempo: { bpm: 120 },
//     quantization: { stepsPerQuarter: 0 },
//     notes: [[79.0, 4.0], [77.0, 0.5], [81.0, 0.5], [72.0, 1.0], [82.0, 1.0], [82.0, 0.5], [72.0, 0.5], [82.0, 0.5], [74.0, 0.5], [72.0, 0.5], [77.0, 0.5], [79.0, 0.5], [79.0, 0.25], [81.0, 0.5], [70.0, 0.25], [82.0, 1.0], [72.0, 0.25], [65.0, 0.5], [77.0, 0.5], [77.0, 0.5], [70.0, 0.25], [81.0, 0.5], [77.0, 0.5], [74.0, 0.5], [74.0, 1.0], [77.0, 1.0], [74.0, 0.5], [72.0, 1.0], [72.0, 1.0], [70.0, 1.0]],
//   }],
// ]);

function receiveOsc(address, value) {
	console.log("received OSC: " + address + ", " + value);

	if (address == 'test') {
    const demoSequences = JSON.parse(value);
    console.log(demoSequences);

    Object.entries(demoSequences).forEach(([k, sequence]) => {
      console.log(sequence);
      document.getElementById('sequencer').appendChild(document.createTextNode(k));
      console.log('I AM HERE!');

      const [min, max] = sequence.notes.reduce((acc, [pitch, _]) => [Math.min(acc[0], pitch), Math.max(acc[1], pitch)], [Infinity, 0]);
      console.log('I AM HERE!');
      const sequencer = Nexus.Add.Sequencer('#sequencer', {
        'size': [1000, 100],
        'mode': 'toggle',
        'rows': max - min + 1,
        'columns': Math.ceil(sequence.notes.reduce((acc, [_, qs]) => acc + qs, 0) / 0.5)
      });
      console.log('I AM HERE!');

      sequence.notes.reduce((step, [pitch, qs]) => {
        [...Array(Math.max(1, qs / 0.5)).keys()].forEach((i) => {
          sequencer.matrix.toggle.cell(step++, pitch - min);
        });
        return step;
      }, 0);
      console.log('I AM HERE!');
    });
	}
}

function setupOsc(oscPortIn, oscPortOut) {
	var socket = io.connect('http://127.0.0.1:8081', { port: 8081, rememberTransport: false });
	socket.on('connect', function() {
		socket.emit('config', {
			server: { port: oscPortIn,  host: '127.0.0.1'},
			client: { port: oscPortOut, host: '127.0.0.1'}
		});
	});
	socket.on('message', function(msg) {
		if (msg[0] == '#bundle') {
			for (var i=2; i<msg.length; i++) {
				receiveOsc(msg[i][0], msg[i].splice(1));
			}
		} else {
			receiveOsc(msg[0], msg.splice(1));
		}
	});
}