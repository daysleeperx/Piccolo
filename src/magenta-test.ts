import { MusicRNN } from '@magenta/music/node/music_rnn';
import { sequences } from '@magenta/music/node/core';

const TWINKLE_TWINKLE = {
  notes: [
    { pitch: 58, startTime: 0, endTime: 0.5 },
    { pitch: 58, startTime: 0.5, endTime: 1 },
    { pitch: 65, startTime: 1, endTime: 1.5 },
    { pitch: 65, startTime: 1.5, endTime: 2 },
    { pitch: 67, startTime: 2, endTime: 2.5 },
    { pitch: 67, startTime: 2.5, endTime: 3 },
    { pitch: 65, startTime: 3, endTime: 4 },
    { pitch: 63, startTime: 4, endTime: 4.5 },
    { pitch: 63, startTime: 4.5, endTime: 5 },
    { pitch: 62, startTime: 5, endTime: 5.5 },
    { pitch: 62, startTime: 5.5, endTime: 6 },
    { pitch: 60, startTime: 6, endTime: 6.25 },
    { pitch: 60, startTime: 6.25, endTime: 6.5 },
    { pitch: 58, startTime: 6.5, endTime: 7.5 },
    { pitch: 65, startTime: 7.5, endTime: 8 },
    { pitch: 65, startTime: 8, endTime: 8.5 },
    { pitch: 63, startTime: 8.5, endTime: 9 },
    { pitch: 63, startTime: 9, endTime: 9.5 },
    { pitch: 62, startTime: 9.5, endTime: 10 },
    { pitch: 62, startTime: 10, endTime: 10.5 },
    { pitch: 60, startTime: 10.5, endTime: 11.5 },
    { pitch: 65, startTime: 11.5, endTime: 12 },
    { pitch: 65, startTime: 12, endTime: 12.5 },
    { pitch: 63, startTime: 12.5, endTime: 13 },
    { pitch: 63, startTime: 13, endTime: 13.5 },
    { pitch: 62, startTime: 13.5, endTime: 14 },
    { pitch: 62, startTime: 14, endTime: 14.5 },
    { pitch: 60, startTime: 14.5, endTime: 15.5 },
    { pitch: 58, startTime: 15.5, endTime: 16 },
    { pitch: 58, startTime: 16, endTime: 16.5 },
    { pitch: 65, startTime: 16.5, endTime: 17 },
    { pitch: 65, startTime: 17, endTime: 17.5 },
    { pitch: 67, startTime: 17.5, endTime: 18 },
    { pitch: 67, startTime: 18, endTime: 18.5 },
    { pitch: 65, startTime: 18.5, endTime: 19.5 },
    { pitch: 63, startTime: 19.5, endTime: 20 },
    { pitch: 63, startTime: 20, endTime: 20.5 },
    { pitch: 62, startTime: 20.5, endTime: 21 },
    { pitch: 62, startTime: 21, endTime: 21.5 },
    { pitch: 60, startTime: 21.5, endTime: 21.75 },
    { pitch: 60, startTime: 21.75, endTime: 22 },
    { pitch: 58, startTime: 22, endTime: 23 }
  ],
  totalTime: 23
}

async function main() {
  const music_rnn = new MusicRNN('https://storage.googleapis.com/magentadata/js/checkpoints/music_rnn/basic_rnn');
  await music_rnn.initialize();

  const seq = sequences.quantizeNoteSequence(TWINKLE_TWINKLE, 4);
  console.log('QUANTIZED SEQ', seq);

  console.time('Start gen');
  const genSeq = await music_rnn.continueSequence(seq, 100, 1);
  console.timeEnd('Start gen');
  console.log(genSeq);
}

main();

