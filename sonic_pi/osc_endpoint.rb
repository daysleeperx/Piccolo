use_bpm 120

live_loop :receive_sequence do
  use_real_time
  seq = sync "/osc*/gen/sequence"
  s = sync "/osc*/gen/steps"
  set :sequence, seq
  set :steps, s
end

live_loop :beat do
  sample :drum_bass_soft
  sleep 1
end

live_loop :play_gen_sequence, sync: :beat do
  gen_notes = get[:sequence] || []
  gen_steps = get[:steps] || []
  notes = gen_notes.zip(gen_steps)
  puts notes
  
  if notes.empty?
    sleep 1
  else
    notes.each do |note, step|
      play note, release: 0.1
      sleep step
    end
  end
end

live_loop :rhytm, sync: :beat do
  play 64, release: 0.2, amp: 0
  sleep 0.25
end
