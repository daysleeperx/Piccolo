use_bpm 120

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
  use_synth :piano
  notes = get[:sequence] || []
  puts notes
  
  if notes.empty?
    sleep 1
  else
    notes.each do |note, step|
      play note, release: 1, amp: 0.4, sustain: 0.5
      sleep step
    end
  end
end

live_loop :rhytm, sync: :beat do
  use_synth :piano
  bass = (ring :Fs1, :Cs1, :E1, :Fs1, :E1, :Cs1, :B0, :Cs1)
  play bass.tick, amp: 0.2
  sleep 0.5
end



