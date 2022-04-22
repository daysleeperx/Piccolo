export namespace MusicGenerator {
    /**
     * Internal music representation types and interfaces.
     */
    export type Pitch = number;
    export type Steps = number;
    export type Note = [pitch: Pitch, quantizedSteps: Steps];

    export interface Quantization {
        stepsPerQuater: number;
    }

    export interface Tempo {
        bpm: number;
    }

    export interface Sequence {
        notes: Note[];
        quantization: Quantization;
        tempo: Tempo;
    }

    export interface Generator {
        /**
         * Generator interface for algorithmic music generation.
         * @param  {Sequence} input Input Sequence
         * @return {Sequence}       Output Sequence
         */
        generate(input: Sequence): Promise<Sequence>;
    }
}
