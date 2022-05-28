import UnreachableCode from '../common/UnreachableCode';
import { MagentaMusicRNNGenerator, MagentaMusicRNNGeneratorOptions } from './MagentaMusicRNNGenerator';
import { MarkovChainMusicGenerator, MarkovChainMusicGeneratorOptions } from './MarkovChainMusicGenerator';

export namespace MusicGenerator {
    /**
     * Internal music representation types and interfaces.
     */
    export type Pitch = number;
    export type Steps = number;
    export type Note = [pitch: Pitch, quantizedSteps: Steps];

    export interface Quantization {
        stepsPerQuarter: Steps;
    }

    export interface Tempo {
        bpm: number;
    }

    export interface Sequence {
        notes: Note[];
        quantization: Quantization;
        tempo: Tempo;
    }

    export type GeneratorOptions =
      MarkovChainMusicGeneratorOptions | MagentaMusicRNNGeneratorOptions;

    export enum GeneratorType {
        MARKOV_CHAIN = 'Markov Chain',
        MAGNETA_MUSIC_RNN = 'Magenta MusicRNN'
    }

    export type GeneratorTypeKey = keyof typeof GeneratorType;

    export interface Generator {
        /**
         * Generator interface for algorithmic music generation.
         * @param  {Sequence} input Input Sequence
         * @return {Sequence}       Output Sequence
         */
        generate(input: Sequence): Promise<Sequence>;
    }

    export class GeneratorFactory {
      /**
       * Factory method for creating Algorithmic Music Composition implementations.
       *
       * @param {GeneratorType} type
       * @param {GeneratorOptions} options
       * @returns {Generator}
       */
      public static async createGenerator(type: GeneratorType, options: GeneratorOptions) {
        switch (type) {
          case GeneratorType.MARKOV_CHAIN:
            return MarkovChainMusicGenerator.createAndInit(
              options as MarkovChainMusicGeneratorOptions,
            );
          case GeneratorType.MAGNETA_MUSIC_RNN:
            return MagentaMusicRNNGenerator.createAndInit(
              options as MagentaMusicRNNGeneratorOptions,
            );
          default:
            return UnreachableCode.never(type);
        }
      }
    }
}
