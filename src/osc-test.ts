const OSC = require('osc-js');

const options = { send: { port: 4560 } };
const osc = new OSC({ plugin: new OSC.DatagramPlugin(options) });

osc.on('open', () => {
  osc.send(new OSC.Message('/gen/sequence', 64, 66, 71, 73, 74, 66, 64, 73, 71, 66, 74, 73));
  osc.send(new OSC.Message('/gen/steps', 0.25, 0.25, 0.25, 0.25, 1, 1, 1, 1, 0.5, 0.5, 0.5, 0.5));

  setTimeout(() => osc.send(new OSC.Message('/gen/play', 1)), 3000);
});

osc.on('/hello/world', (message: any) => {
  console.log(message);
})

osc.open({ port: 9912 }); // bind socket to localhost:9912
