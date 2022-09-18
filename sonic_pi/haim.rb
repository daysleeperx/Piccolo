# "Summer Girl" by HAIM
# Coded by Viktor Pavlov

use_bpm 100

# Globals
set :bass_line, [
  [:E2, 1.75],
  [:Ds3, 0.25],
  [:E2, 0.25],
  [:r, 0.25],
  [:E2, 0.5],
  [:Ds3, 0.5],
  [:E2, 0.5],
  [:B2, 3],
  [:Fs2, 0.5],
  [:Bb2, 0.25],
  [:B2, 0.25],
]

set :sax_part, [
  [59, 0.25],
  [63, 0.5],
  [57, 0.25],
  [61, 0.5],
  [56, 0.25],
  [59, 0.5],
  [54, 0.25],
  [57, 0.5],
  [52, 0.5],
  [56, 0.5],
  [54, 4],
  [59, 0.25],
  [63, 0.5],
  [57, 0.25],
  [61, 0.5],
  [56, 0.25],
  [59, 0.5],
  [54, 0.25],
  [57, 0.5],
  [52, 0.5],
  [56, 0.5],
  [59, 4],
  [59, 0.25],
  [63, 0.5],
  [57, 0.25],
  [61, 0.5],
  [56, 0.25],
  [59, 0.5],
  [54, 0.25],
  [57, 0.5],
  [52, 0.5],
  [56, 0.5],
  [54, 4],
  [59, 0.25],
  [63, 0.5],
  [57, 0.25],
  [61, 0.5],
  [56, 0.25],
  [59, 0.5],
  [54, 0.25],
  [57, 0.5],
  [52, 0.5],
  [56, 0.5],
  [51, 4],
]

# Functions
define :pattern do |pattern|
  return pattern.ring.tick == "x"
end

define :sax_synth_defaults do |step| 
  return {
    cutoff: 96, 
    amp: 1, 
    attack: step > 2 ? step * 0.1 : 0.2, 
    attack_level: 1, 
    decay: step * 0.1, 
    sustain: step * 0.3, 
    sustain_level: 0.7, 
    release: step > 1 ? step * 0.4 : step * 0.2
  }
end

# Metronome
live_loop :met_whole do
  sleep 4
end

live_loop :met_q, sync: :met_whole do
  sleep 1
end

# Loops
live_loop :receive_sax_part do
  use_real_time
  seq = sync "/osc*/gen/sequence"
  s = sync "/osc*/gen/steps"
  set :sax_part, seq.zip(s)
end

live_loop :kick, sync: :met_q do
  sample :drum_heavy_kick if pattern "x-x----x---x-x--"
  sleep 0.25
end

live_loop :snare, sync: :met_q do
  sample :drum_snare_hard if pattern "----x----x--x---"
  sleep 0.25
end

live_loop :hihat, sync: :met_q do
  sample :drum_cymbal_closed
  sleep 0.5
end

live_loop :percussion, sync: :met_whole do
  stop
  sample :tabla_ghe1, amp: 1, rate: 1.2  if pattern "x-x----x-x--x---"
  sleep 0.25
end

live_loop :bass, sync: :met_whole do
  stop
  use_synth :saw
  note, step = get[:bass_line].tick
  play note, amp: 2, cutoff: 50, attack: 0, decay: step * 0.5, sustain: 0, release: step * 0.7
  sleep step
end

with_fx :reverb, room: 0.9 do
  live_loop :sax, sync: :met_whole do
    stop
    notes = get[:sax_part] || []
    puts notes

    if notes.empty?
      sleep 1
    else
      notes.each do |note, step|
        use_synth :saw
        use_synth_defaults sax_synth_defaults step
        play note 
        sleep step
      end
    end
  end
end

use_osc "localhost", 9912
osc "/gen/sequence", *get[:sax_part].to_json

# live_loop :midi_moog, sync: :met_q do
#   note, step = bass_line.tick
#   midi_note_on note, channel: 0
#   sleep step
#   midi_note_off note, channel: 0
# end
#
# midi_all_notes_off

