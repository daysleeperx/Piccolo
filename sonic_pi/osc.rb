live_loop :foo2 do
    # sync :rhytm
    with_fx :reverb, mix: 0.2, room: 0.8 do
      use_synth :fm
      use_real_time
      note = sync "/osc*/melody/notes"
      play note
    end
  end