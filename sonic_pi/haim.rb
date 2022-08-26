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
  sample :drum_cymbal_closed if pattern "x-x-x-x-x-x-x-x-"
  sleep 0.25
end
