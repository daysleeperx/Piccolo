import { INoteSequence } from "@magenta/music/node/protobuf";
import { MusicRNN  } from "@magenta/music/node/music_rnn";
import { MusicGenerator } from "./Generator";

export class MagentaMusicRNNGenerator implements MusicGenerator.Generator {
    private constructor(
        private readonly musicRnn: MusicRNN,
        private readonly steps: number,
        private readonly temperature?: number,
    ) {}

    public async createAndInit(): Promise<MagentaMusicRNNGenerator> {
        const musicRnn = new MusicRNN('https://storage.googleapis.com/magentadata/js/checkpoints/music_rnn/basic_rnn');
        await musicRnn.initialize();
        return new MagentaMusicRNNGenerator(musicRnn, 100);
    }

    public async generate(input: MusicGenerator.Sequence): Promise<MusicGenerator.Sequence> {
        const { notes, quantization, tempo } = input;
        const quantizedSeq: INoteSequence = {
            notes: notes.reduce((acc, [pitch, duration]) => {
                acc.push({
                    pitch,
                    quantizedStartStep: acc[acc.length - 1].quantizedEndStep ?? 0,
                    quantizedEndStep: (acc[acc.length - 1].quantizedEndStep ?? 0) + duration,
                })
                return acc;
            }, []),
            quantizationInfo: {
                stepsPerQuarter: quantization.stepsPerQuater
            },
            tempos: [ {qpm: tempo.bpm} ]
         };

         const generatedRnnSequence: INoteSequence = await this.musicRnn.continueSequence(quantizedSeq, this.steps, this.temperature);
         return {
             tempo,
             quantization,
             notes: generatedRnnSequence.notes.map((note) => [note.pitch, note.quantizedEndStep - note.quantizedStartStep])
         }
    }
}