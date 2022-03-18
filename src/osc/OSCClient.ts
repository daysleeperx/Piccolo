import { MusicGenerator } from "../generator/Generator";
import { OSC } from './OSC';

const OSCNative = require('osc-js');

export default class OSCClient implements OSC.Client<MusicGenerator.Pitch> {
    private osc: any;

    constructor(private readonly config: OSC.ClientConfig) {
        this.osc = new OSCNative({ plugin: new OSCNative.DatagramPlugin({ send: { port: this.config.port }})});
        this.osc.open();
    }

    public send(message: MusicGenerator.Pitch): void {
        /* eslint-disable no-console */
        console.log('Sending OSC: ', message); 
        this.osc.send(new OSCNative.Message(this.config.path, message));
    }
}