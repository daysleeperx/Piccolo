import enquirer from 'enquirer';
import { CLIApplication } from '../src/CLIApplication';
import { MusicGenerator } from "../src/generator/Generator";
import MarkovChainMusicGenerator from "../src/generator/MarkovChainMusicGenerator";
import { OSC } from "../src/osc/OSC";
import MidiBuilder from "../src/parser/MidiBuilder";
import { MidiParser } from "../src/parser/MidiParser";
import { Midi } from "../src/parser/Parser";

jest.mock('enquirer');

describe("Cli Application tests", () => {
  let app: CLIApplication;

  test("run cli wihout errors", async () => {
    const parser: Midi.Parser = new MidiParser();
    const builder: Midi.Builder = new MidiBuilder();
    const generator: MusicGenerator.Generator = new MarkovChainMusicGenerator(100, 3);
    const oscClient: OSC.Client<MusicGenerator.Pitch>= {
        start: () => jest.fn(),
        send: (message: MusicGenerator.Pitch) => jest.fn(_ => console.log(message)),
        close: () => jest.fn(),
    };
    enquirer.prompt = jest.fn().mockResolvedValue({response: '1'});
    app = new CLIApplication(
        parser, 
        builder, 
        generator, 
        oscClient, 
        {
            source: '../test/data/invent2.midi',
            output: './',
            name: 'test',
            outputsNum: '1',
            steps: '100',
            order: '3'
        }
    );

    await app.runCli();
  });
});