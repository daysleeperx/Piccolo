live_loop :foo do
    use_real_time
    a, b, c = sync "/osc*/trigger/prophet"
    synth :fm, note: a, cutoff: b, sustain: c
  end