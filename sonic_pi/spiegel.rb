# Coded by Viktor Pavlov
# Piano part from Arvo Pärt's "Spiegel im Spiegel"

use_bpm 80

set :sequence, []

live_loop :receive_sequence do
  use_real_time
  seq = sync "/osc*/gen/sequence"
  s = sync "/osc*/gen/steps"
  set :sequence, seq.zip(s)
end

live_loop :metronome do
  sleep 1
end

with_fx :reverb, room: 1 do
  live_loop :piano_part, sync: :metronome do
    F = (ring :C5, :F5, :A5)
    Gm7 = (ring :As4, :F5, :G5)
    Bbmaj7 = (ring :D5, :A5, :Bb5)
    
    use_synth :piano
    use_synth_defaults sustain: 0.8, release: 0.2, hard: 0.1

    18.times do
      play F.tick
      sleep 1 
    end
    6.times do
      play Gm7.tick
      sleep 1
    end
    24.times do
      play F.tick
      sleep 1
    end
    6.times do
      play Bbmaj7.tick
      sleep 1
    end
  end
  
  live_loop :play_gen_sequence, sync: :metronome do
    notes = get[:sequence] || []
    puts notes
    
    if notes.empty?
      sleep 1
    else
      notes.each do |note, step|
        use_synth :blade
        use_synth_defaults amp: 0.4, attack: step * 0.4, decay: step * 0.1,
          sustain: step * 0.3, release: step * 0.2, vibrato_rate: 7
        play note
        use_synth :square
        play note, amp: 0.03
        sleep step
      end
    end
  end
end
