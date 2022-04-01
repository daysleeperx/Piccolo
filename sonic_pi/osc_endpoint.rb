use_bpm 120

live_loop :receive_sequence do
  use_real_time
  seq = sync "/osc*/gen/sequence"
  s = sync "/osc*/gen/steps"
  set :sequence, seq
  set :steps, s
end

live_loop :play_seq do
  use_real_time
  play = sync "/osc*/gen/play"
  puts "Play"
end

live_loop :play_gen_sequence, sync: :play_seq do
  gen_notes = get[:sequence] || []
  gen_steps = get[:steps] || []
  notes = gen_notes.zip(gen_steps).ring
  puts notes
  
  loop do
    note, step = notes.tick
    play note, release: 0.1
    sleep step
  end
end