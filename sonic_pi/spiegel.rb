# Coded by Viktor Pavlov
# Piano part from Arvo Pärt's "Spiegel im Spiegel"

use_bpm 80

live_loop :receive_sequence do
  use_real_time
  seq = sync "/osc*/gen/sequence"
  s = sync "/osc*/gen/steps"
  set :sequence, seq.zip(s)
end

live_loop :metronome do
  sleep 1
end

live_loop :piano_part, sync: :metronome do
  F = (ring :C5, :F5, :A5)
  Gm7 = (ring :As4, :F5, :G5)
  Bbmaj7 = (ring :D5, :A5, :Bb5)
  
  with_fx :reverb, room: 1 do
    use_synth :piano
    18.times do
      play F.tick, release: 1, hard: 0.1
      sleep 1
    end
    6.times do
      play Gm7.tick, release: 1, hard: 0.1
      sleep 1
    end
    24.times do
      play F.tick, release: 1, hard: 0.1
      sleep 1
    end
    6.times do
      play Bbmaj7.tick, release: 1, hard: 0.1
      sleep 1
    end
  end
end

live_loop :play_gen_sequence, sync: :metronome do
  use_synth :square
  notes = get[:sequence] || []
  puts notes
  
  with_fx :reverb, room: 1 do
    if notes.empty?
      sleep 1
    else
      notes.each do |note, step|
        play note, attack: 0.3, sustain: step, amp: 0.2, cutoff: 90
        sleep step
      end
    end
  end
end
