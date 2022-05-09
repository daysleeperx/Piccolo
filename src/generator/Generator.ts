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
        stepsPerQuater: Steps;
    }

    export interface Tempo {
        bpm: number;
    }

    export interface Sequence {
        notes: Note[];
        quantization: Quantization;
        tempo: Tempo;
    }

    export type GeneratorOptions = MarkovChainMusicGeneratorOptions | MagentaMusicRNNGeneratorOptions;

    export enum GeneratorType {
        MARKOV_CHAIN,
        MAGNETA_MUSIC_RNN
    }

    export interface Generator {
        /**
         * Generator interface for algorithmic music generation.
         * @param  {Sequence} input Input Sequence
         * @return {Sequence}       Output Sequence
         */
        generate(input: Sequence): Promise<Sequence>;
    }

    export class GeneratorFactory {
      public async createGenerator(type: GeneratorType, options: GeneratorOptions) {
        switch (type) {
          case GeneratorType.MARKOV_CHAIN:
            return MarkovChainMusicGenerator.createAndInit(options as MarkovChainMusicGeneratorOptions);
          case GeneratorType.MAGNETA_MUSIC_RNN:
            return MagentaMusicRNNGenerator.createAndInit(options as MagentaMusicRNNGeneratorOptions);
        }
      }
    }
}
