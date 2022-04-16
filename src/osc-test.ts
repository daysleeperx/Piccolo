import { MusicGenerator } from "./generator/Generator";
import MarkovChainMusicGenerator from "./generator/MarkovChainMusicGenerator";

const OSC = require('osc-js');

const options = { send: { port: 4560 } };
const osc = new OSC({ plugin: new OSC.DatagramPlugin(options) });
const generator : MusicGenerator.Generator = new MarkovChainMusicGenerator(10, 2);

osc.on('open', () => {
  osc.send(new OSC.Message('/gen/sequence', 64, 66, 71, 73, 74, 66, 64, 73, 71, 66, 74, 73));
  osc.send(new OSC.Message('/gen/steps', 0.25, 0.25, 0.25, 0.25, 1, 1, 1, 1, 0.5, 0.5, 0.5, 0.5));

  setTimeout(() => osc.send(new OSC.Message('/gen/play', 1)), 3000);
});

osc.on('/hello/world', (message: any) => {
  console.log(message);
  console.log(message.args[0]);
  const sequence : MusicGenerator.Sequence = {
    notes: JSON.parse(message.args[0]),
    tempo: { bpm : 120 },
    quantization: { stepsPerQuater: 1 }
  }
  const genSequence : MusicGenerator.Sequence = generator.generate(sequence);

  let [notes, steps] : [number[], number[]] = [[], []];
  genSequence.notes.forEach(([note, step]) => {
    notes.push(note);
    steps.push(step);
  });
  
  osc.send(new OSC.Message('/gen/sequence', ...notes));
  osc.send(new OSC.Message('/gen/steps', ...steps));
})

osc.open({ port: 9912 }); // bind socket to localhost:9912
