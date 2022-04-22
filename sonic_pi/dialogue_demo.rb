use_bpm 120

notes = [[64, 0.25], [66, 0.25], [71, 0.25], [73, 0.25], [74, 1], [66, 1], [64, 1], [73, 1], [71, 1], [66, 1], [74, 1], [73, 1]]
set :sequence, notes

live_loop :receive_sequence do
  use_real_time
  seq = sync "/osc*/gen/sequence"
  s = sync "/osc*/gen/steps"
  set :sequence, seq.zip(s)
end

live_loop :beat do
  sample :drum_bass_soft
  sleep 1
end

live_loop :play_gen_sequence, sync: :beat do
  notes = get[:sequence] || []
  puts notes
  
  if notes.empty?
    sleep 1
  else
    notes.each do |note, step|
      play note, release: 0.1, amp: 0.4, sustain: 0.1
      sleep step
    end
  end
end

use_osc "localhost", 9912
osc "/gen/sequence", *get[:sequence].to_json