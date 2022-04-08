import { OSC } from './OSC';

const OSCNative = require('osc-js');

export default class OSCClient implements OSC.Client<number[]> {
  private osc: any;

  constructor(private readonly config: OSC.ClientConfig) {
    this.osc = new OSCNative({
      plugin: new OSCNative.DatagramPlugin({ send: { port: this.config.port } }),
    });
  }

  public start(): void {
    this.osc.open();
  }

  public send(path: string, message: number[]): void {
    console.log('PATH', path);
    // this.osc.send(new OSC.Message('/gen/sequence', 64, 66, 71, 73, 74, 66, 64, 73, 71, 66, 74, 73));
    // this.osc.send(new OSC.Message('/gen/steps', 0.25, 0.25, 0.25, 0.25, 1, 1, 1, 1, 1, 1, 1, 1));
    this.osc.send(new OSCNative.Message(path, ...message));
  }

  public close(): void {
    this.osc.close();
  }
}
