import { MusicGenerator } from './Generator';
import Utils from '../common/Utils';

type TransitionMatrix = Map<string, Map<string, number>>;

function getRandomSeqKey(matrix: TransitionMatrix): string {
  return [...matrix.keys()][Math.floor(Math.random() * matrix.size)];
}

function getWeightedRandomKey(probs: Map<string, number>): string {
  const probsSum: number = [...probs.values()].reduce((a, b) => a + b, 0);
  const rand: number = Math.floor(Math.random() * probsSum);
  let sum = 0;

  return [...probs.keys()].find((k) => rand <= (sum += probs.get(k)));
}

function transitionGraph(notes: MusicGenerator.Note[], order: number): TransitionMatrix {
  return notes
    .slice(Math.min(order, notes.length - 1))
    .map((note: MusicGenerator.Note, idx: number) => [note, notes.slice(idx, idx + order)])
    .reduce(
      (acc, [curr, prev]) => {
        const [nextPitch, nextDuration] = curr;
        const seqKey: string = (prev as MusicGenerator.Note[]).map<string>(([pitch, duration]) => `${pitch}:${duration}`).join('->');
        const probs: Map<string, number> = acc.get(seqKey) ?? new Map();
        return acc.set(
          seqKey,
          probs.set(
            `${nextPitch}:${nextDuration}`,
            (probs.get(`${nextPitch}:${nextDuration}`) ?? 0) + 1,
          ),
        );
      },
      new Map(),
    );
}

function* generateSequence(
  current: MusicGenerator.Note[],
  transtions: TransitionMatrix,
  step: number,
): Generator<MusicGenerator.Note> {
  let next: MusicGenerator.Note[];

  if (step === 0) {
    return;
  }

  const seqKey: string = current.map<string>(([pitch, duration]) => `${pitch}:${duration}`).join('->');
  if (transtions.has(seqKey)) {
    const nextNote = Utils.keyToNote(getWeightedRandomKey(transtions.get(seqKey)));
    next = [...current.slice(1), nextNote];
  } else {
    next = getRandomSeqKey(transtions).split('->').map(Utils.keyToNote);
  }

  yield next[next.length - 1];
  yield* generateSequence(next, transtions, step - 1);
}

export interface MarkovChainMusicGeneratorOptions {
  steps: number;
  order: number;
}
export class MarkovChainMusicGenerator implements MusicGenerator.Generator {
  private constructor(
        private readonly steps: number,
        private readonly order: number,
  ) {}

  public static async createAndInit(
    options: MarkovChainMusicGeneratorOptions,
  ): Promise<MarkovChainMusicGenerator> {
    const { steps, order } = options;
    return new MarkovChainMusicGenerator(Number(steps), Number(order));
  }

  public async generate(input: MusicGenerator.Sequence): Promise<MusicGenerator.Sequence> {
    const { notes, quantization, tempo } : MusicGenerator.Sequence = input;
    const transitions: TransitionMatrix = transitionGraph(notes, this.order);
    const seed: MusicGenerator.Note[] = getRandomSeqKey(transitions).split('->').map(Utils.keyToNote);
    const generatedNotes: MusicGenerator.Note[] = [
      ...generateSequence(seed, transitions, this.steps),
    ];
    return { quantization, tempo, notes: generatedNotes };
  }
}
