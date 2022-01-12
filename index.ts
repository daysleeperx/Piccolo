import { readFileSync } from 'fs';
import path from 'path';

var midiConverter = require('midi-converter');

async function main() {
    const [file] = process.argv.slice(2);

    const buffer = readFileSync(path.join(__dirname, file), {encoding: 'binary'});
    const { tracks } = midiConverter.midiToJson(buffer);

    console.log(tracks[1].slice(0, 10));
}

main();