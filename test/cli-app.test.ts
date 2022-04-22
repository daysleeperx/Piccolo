// TODO: remove or update tests
// import enquirer from 'enquirer';
// import { CLIApplication } from '../src/CLIApplication';
// import { MusicGenerator } from "../src/generator/Generator";
// import MarkovChainMusicGenerator from "../src/generator/MarkovChainMusicGenerator";
// import { OSC } from "../src/osc/OSC";
// import OSCClient from '../src/osc/OSCClient';
// import MidiBuilder from "../src/parser/MidiBuilder";
// import { MidiParser } from "../src/parser/MidiParser";
// import { Midi } from "../src/parser/Parser";
// 
// jest.mock('enquirer');
// 
// xdescribe("Cli Application tests", () => {
//   test("run cli wihout errors", async () => {
//     const parser: Midi.Parser = new MidiParser();
//     const builder: Midi.Builder = new MidiBuilder();
//     const generator: MusicGenerator.Generator = new MarkovChainMusicGenerator(100, 3);
//     const oscClient: OSC.Client<MusicGenerator.Pitch>= new OSCClient({host: 'localhost', path: '', port: 300});
//     enquirer.prompt = jest.fn().mockResolvedValue({response: '1'});
//     const app = new CLIApplication(
//         parser, 
//         builder, 
//         generator, 
//         oscClient, 
//         {
//             source: '../test/data/invent2.midi',
//             output: '.',
//             name: 'test',
//             outputsNum: '1',
//             steps: '100',
//             order: '3'
//         }
//     );
// 
//     await app.runCli();
//   });
// 
//   test("run cli and send osc messages", async () => {
//     const parser: Midi.Parser = new MidiParser();
//     const builder: Midi.Builder = new MidiBuilder();
//     const generator: MusicGenerator.Generator = new MarkovChainMusicGenerator(100, 2);
//     const oscClient: OSC.Client<MusicGenerator.Pitch>= new OSCClient({host: 'localhost', path: 'test/test', port: 300});
//     // const spy = jest.spyOn(oscClient, 'send').mockImplementation((msg) => console.log(msg));
//     enquirer.prompt = jest.fn().mockResolvedValue({response: '1', osc: true, seq: './test_0.midi'});
//     const app = new CLIApplication(
//         parser, 
//         builder, 
//         generator, 
//         oscClient, 
//         {
//             source: '../test/data/invent2.midi',
//             output: '.',
//             name: 'test',
//             outputsNum: '1',
//             steps: '5',
//             order: '3'
//         }
//     );
// 
//     await app.runCli();
// 
//     // expect(spy).toBeCalledTimes(1);
//   });
// });