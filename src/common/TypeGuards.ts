import { MusicGenerator } from '../generator/Generator';
import { MagentaMusicRNNGeneratorOptions } from '../generator/MagentaMusicRNNGenerator';
import { MarkovChainMusicGeneratorOptions } from '../generator/MarkovChainMusicGenerator';
import { Midi } from '../parser/Parser';

export default class TypeGuards {
  public static isNoteMessage(msg: Midi.Message): msg is Midi.NoteOn | Midi.NoteOff {
    return (msg as Midi.NoteOn | Midi.NoteOff).note !== undefined &&
           (msg as Midi.NoteOn | Midi.NoteOff).velocity !== undefined;
  }

  public static isMarkovChainMusicGeneratorOptions(
    options: MusicGenerator.GeneratorOptions,
  ): options is MarkovChainMusicGeneratorOptions {
    return (options as MarkovChainMusicGeneratorOptions).order !== undefined &&
           (options as MarkovChainMusicGeneratorOptions).steps !== undefined;
  }

  public static isMagentaMusicGeneratorOptions(
    options: MusicGenerator.GeneratorOptions,
  ): options is MagentaMusicRNNGeneratorOptions {
    return (options as MagentaMusicRNNGeneratorOptions).chordProgression !== undefined &&
           (options as MagentaMusicRNNGeneratorOptions).temperature !== undefined &&
           (options as MagentaMusicRNNGeneratorOptions).steps !== undefined;
  }
}
