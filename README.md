```
 ____                              ___
/\  _`\   __                      /\_ \
\ \ \L\ \/\_\    ___    ___    ___\//\ \     ___
 \ \ ,__/\/\ \  /'___\ /'___\ / __`\\ \ \   / __`\
  \ \ \/  \ \ \/\ \__//\ \__//\ \L\ \\_\ \_/\ \L\ \
   \ \_\   \ \_\ \____\ \____\ \____//\____\ \____/
    \/_/    \/_/\/____/\/____/\/___/ \/____/\/___/
```
Piccolo is an algorithmic music generator that supports integration with [Sonic Pi](https://sonic-pi.net/), utilizing the Open Sound Control protocol. Melody variations can be generated from MIDI sources and from messages sent by Sonic Pi directly in real-time. Algorithmic music composition implementations are based on Markov chains and [Google AI’s Magenta](https://magenta.tensorflow.org/) neural network.
# Prerequisites
- [Yarn](https://yarnpkg.com/)
- [NodeJS](https://nodejs.org/en/) v16.13.2
- [Typescript](https://www.typescriptlang.org/) v4.5.5+
# Installation
In order to install the application run the following commands
```bash
yarn install
yarn compile
```
# Usage
The first step would be to copy the code from [Sonic Pi Demo Endpoint](./sonic_pi/spiegel.rb) to an empty buffer in Sonic Pi.
After pressing Run in Sonic Pi, the piano part should start playing. The next step is to start the application.

In order to run the application run the following command
```bash
node lib/src/cli.js
```

At the start of the application, the user is presented with multiple modes to choose from. The mode `MIDI` will be chosen in this example
```
? Choose application mode ...
> MIDI
  DIALOGUE
  SEQUENTIAL
```

Next, some options need to be provided including the relative path of MIDI input, the location of the output files, the number of outputs and name of output file. In this example the file spiegel.midi is chosen (this file can be found in the `midi/` folder in the root directory of the project repository). Additionally, an output folder needs to be created (`midi_out/` is created in this example in the root directory).
```
? Please provide the following information
                Source : midi/spiegel.midi
                   Out : midi_out/
        No. of outputs : 5
   Name of output file : test_melody
```

Afterwards the user will be presented with the music generator choice and corresponding options
```
? Choose generator type ...
> Markov Chain
  Magenta MusicRNN
     The order of the Markov chain : 2
   Number of steps to be generated : 100
```
If the MIDI file has more than one track, the user will be presented with the following question:
```
? The provided MIDI track includes multiple tracks.
Enter source track number: > 0
```

The MIDI file `spiegel.midi` consists of multiple tracks. Since variations on the viola melody will be generated in this example, the track number zero ("viola") needs to be chosen (the numeration of tracks starts from zero).

The application will proceed with generating the sequences and the user will be presented
with a choice of sequences to send via OSC after the generation finishes.
```
Send sequence via OSC? (y/N) * true
? Choose sequence ...
> midi_out/3/test_melody_0.midi
  midi_out/3/test_melody_1.midi
  midi_out/3/test_melody_2.midi
  midi_out/3/test_melody_3.midi
  midi_out/3/test_melody_4.midi
```

The selected sequences will then be sent to Sonic Pi and the incoming OSC messages will be seen in Sonic Pi’s Cue Viewer.

The process of choosing and sending the generated sequence to Sonic Pi can be repeated
until the usertypes `N` in the `Send another sequence via OSC?` prompt.
# License
[MIT License](./LICENSE)
