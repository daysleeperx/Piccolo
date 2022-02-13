namespace MusicGenerator {
    /**
     * Internal music representation types and interfaces.
     */
    export type Note = [pitch: number, duration: number];
    export type Sequence = Note[];

    export interface Generator {
        /**
         * Generator interface for algorithmic music generation. 
         * @param  {Buffer | string} input Raw data, base64 encoded data or path
         * @return {Buffer | string}       Raw data, base64 encoded data or path
         */
        generate(input: Buffer | string): Buffer | string;
    }
}