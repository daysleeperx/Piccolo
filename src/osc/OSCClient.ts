import chalk from 'chalk';
import { MusicGenerator } from '../generator/Generator';
import { OSC } from './OSC';

const OSCNative = require('osc-js');

const { log } = console;

export default class OSCClient implements OSC.Client<MusicGenerator.Pitch> {
  private osc: any;

  constructor(private readonly config: OSC.ClientConfig) {
    this.osc = new OSCNative({
      plugin: new OSCNative.DatagramPlugin({ send: { port: this.config.port } }),
    });
    this.osc.on('open', () => log(chalk.white('OSC Client ready\n')));
    this.osc.on('close', () => log(chalk.white('OSC Connection closed.\n')));
  }

  public start(): void {
    this.osc.open();
  }

  public send(message: MusicGenerator.Pitch): void {
    this.osc.send(new OSCNative.Message(this.config.path, message));
  }

  public close(): void {
    this.osc.close();
  }
}
