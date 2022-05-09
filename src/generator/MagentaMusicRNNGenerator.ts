import { INoteSequence } from '@magenta/music/node/protobuf';
import { MusicRNN } from '@magenta/music/node/music_rnn';
import { sequences } from '@magenta/music/node/core';
import { MusicGenerator } from './Generator';

export interface MagentaMusicRNNGeneratorOptions {
    steps: number;
    temperature: number;
    chordProgression: string;
}
export class MagentaMusicRNNGenerator implements MusicGenerator.Generator {
  private constructor(
        private readonly musicRnn: MusicRNN,
        private readonly steps: number,
        private readonly temperature: number,
        private readonly chordProgression: string[],
  ) {}

  public static async createAndInit(options: MagentaMusicRNNGeneratorOptions): Promise<MagentaMusicRNNGenerator> {
    const { steps, temperature, chordProgression } = options;
    const musicRnn = new MusicRNN('https://storage.googleapis.com/magentadata/js/checkpoints/music_rnn/chord_pitches_improv');
    await musicRnn.initialize();
    return new MagentaMusicRNNGenerator(musicRnn, +steps, +temperature, chordProgression.split(','));
  }

  public async generate(input: MusicGenerator.Sequence): Promise<MusicGenerator.Sequence> {
    const { notes, quantization, tempo } = input;
    const quantizedSeq: INoteSequence = {
      notes: notes.reduce((acc, [pitch, duration]) => {
        acc.push({
          pitch,
          startTime: acc[acc.length - 1]?.endTime ?? 0,
          endTime: (acc[acc.length - 1]?.endTime ?? 0) + (duration / quantization.stepsPerQuater * 0.5),
        });
        return acc;
      }, []),
    };
    quantizedSeq.totalTime = quantizedSeq.notes[quantizedSeq.notes.length - 1].endTime;

    const quantizedSeq2 = sequences.quantizeNoteSequence(quantizedSeq, 4);

    const generatedRnnSequence: INoteSequence = await this.musicRnn.continueSequence(quantizedSeq2, this.steps, this.temperature, this.chordProgression);
    return {
      tempo,
      quantization: { stepsPerQuater: 4 },
      notes: generatedRnnSequence.notes.map((note) => [note.pitch, note.quantizedEndStep - note.quantizedStartStep]),
    };
  }
}
