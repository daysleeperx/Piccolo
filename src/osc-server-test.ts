import { Server } from 'node-osc';

var oscServer = new Server(3333, '0.0.0.0', () => {
  console.log('OSC Server is listening');
});

oscServer.on('message', function (msg) {
  console.log(`Message: ${msg}`);
  oscServer.close();
});