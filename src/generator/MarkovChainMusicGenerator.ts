import { MusicGenerator } from './Generator';
import Utils from '../common/Utils';

// const PrettyTable = require('prettytable');

type TransitionMatrix = Map<string, Map<string, number>>;

// function printTransitionMatrix(matrix: TransitionMatrix): void {
//   const pt = new PrettyTable();
//   const headers: Set<string> = new Set();
//   const rows = [];
// 
//   for (const [_, v] of matrix.entries()) {
//     for (const k of v.keys()) {
//       headers.add(k);
//     }
//   }
// 
//   for (const current of matrix.keys()) {
//     const row = [current];
//     for (const header of headers) {
//       row.push((matrix.get(current).get(header) ?? 0).toString());
//     }
//     rows.push(row);
//   }
// 
//   pt.create(['current', ...headers], rows);
//   pt.print();
// }
function getRandomSeqKey(matrix: TransitionMatrix | Map<string, number>): string {
  return [...matrix.keys()][Math.floor(Math.random() * matrix.size)];
}

function transitionMatrix(notes: MusicGenerator.Note[], order: number): TransitionMatrix {
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
    const nextNote = Utils.keyToNote(getRandomSeqKey(transtions.get(seqKey)));
    next = [...current.slice(1), nextNote];
  } else {
    next = getRandomSeqKey(transtions).split('->').map(Utils.keyToNote);
  }

  yield next[next.length - 1];
  yield* generateSequence(next, transtions, step - 1);
}

export default class MarkovChainMusicGenerator implements MusicGenerator.Generator {
  constructor(
        private readonly steps: number,
        private readonly order: number,
  ) {}

  public async generate(input: MusicGenerator.Sequence): Promise<MusicGenerator.Sequence> {
    const { notes, quantization, tempo } : MusicGenerator.Sequence = input;
    const transitions: TransitionMatrix = transitionMatrix(notes, this.order);
    console.log('Transitions:', transitions);
    // printTransitionMatrix(transitions);
    const seed: MusicGenerator.Note[] = getRandomSeqKey(transitions).split('->').map(Utils.keyToNote);
    const generatedNotes: MusicGenerator.Note[] = [
      ...generateSequence(seed, transitions, this.steps),
    ];
    return { quantization, tempo, notes: generatedNotes };
  }
}
