use_bpm 100

live_loop :metronome do
  sleep 1
end

define :pattern do |pattern|
  return pattern.ring.tick == "x"
end

live_loop :kick, sync: :metronome do
  sample :drum_heavy_kick if pattern "x-x----x---x-x--"
  sleep 0.25
end

live_loop :snare, sync: :metronome do
  sample :drum_snare_hard if pattern "----x----x--x---"
  sleep 0.25
end

live_loop :hihat, sync: :metronome do
  sample :drum_cymbal_closed
  sleep 0.5
end

bass_line = [
  [:E1, 1.75], 
  [:Ds2, 0.25], 
  [:E1, 0.25], 
  [:r, 0.25], 
  [:E1, 0.5], 
  [:Ds2, 0.5], 
  [:E1, 0.5], 
  [:B1, 3],
  [:Fs1, 0.5],
  [:Bb1, 0.25],
  [:B1, 0.25],
].ring

live_loop :bass, sync: :metronome do
  use_synth :saw
  note, step = bass_line.tick
  play note, cutoff: 50, sustain: step, release: 0
  sleep step
end
