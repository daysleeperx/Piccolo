import { readFileSync } from 'fs';
import path from 'path';

let midiParser  = require('midi-parser-js');

function main() {
    const [file] = process.argv.slice(2);

    const input = readFileSync(path.join(__dirname, file), { encoding: "base64" });
    
    const { track } = midiParser.parse(input);
    track[1].event.forEach((e: any) => console.log(e));
}

main();