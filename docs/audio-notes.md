# Catch the Phish audio

`public/audio/cyber-loop.ogg` is an original instrumental score, **Signal Drift**, created for this application. All musical notes, synth voices, percussion, and effects were composed and synthesized locally. It contains no downloaded music, samples, voices, or third-party recordings.

The 48-second stereo loop runs at 80 BPM. Soft, detuned pads move through E minor 9, C major 9, G major 9, and D six/add-nine. A restrained glass arpeggio, warm bass, and gentle pulse support the cyber visual direction. Note releases and stereo echoes wrap around the loop boundary so the ambience remains continuous. The encoded asset is approximately 850 KiB, 48 kHz stereo Opus in an Ogg container, supported by the packaged Chromium runtime.

The generated source peaks at −2.05 dBFS, with an RMS of −16.28 dBFS before the application's deliberately quiet playback gains. Music drops further during a quiz to keep reading and concentration comfortable. The result screen raises it slightly. Sound effects are short Web Audio tones with smooth envelopes: a small touch click, a lighter keyboard tick, an upward screen transition, a bright correct chime, a soft downward incorrect tone, and a longer musical completion flourish. There is no loud buzzer.

## Integration

Import `gameAudio` from `src/lib/audio.ts`:

```ts
gameAudio.unlock(); // Synchronously inside pointerdown or keydown.
gameAudio.setScene('quiz');
gameAudio.play('correct');
const muted = gameAudio.toggleMute();
```

Supported effects are `tap`, `key`, `transition`, `correct`, `incorrect`, and `complete`. Scenes are `idle`, `registration`, `instructions`, `quiz`, and `result`. The `muted` getter reports the current setting, which is saved defensively in local storage. Repeated unlocks reuse one audio graph and one looping track. Rapid duplicate effects are throttled. Hidden documents fade audio out, pause the track, and suspend the audio context; returning resumes the existing track when the user has unlocked sound. Playback rejection and unavailable audio hardware do not interrupt the game.

Browsers allow audio after a user gesture; the first touch starts the score. The packaged Electron app may additionally enable autoplay. Muting remains available in either case.

## Regeneration

Run `scripts/generate-audio.py` with Python, NumPy, and FFmpeg available. The deterministic seed makes the composition reproducible. The script writes only the final Ogg asset to `public/audio/` and prints duration, level, size, and loop-boundary metrics. Temporary uncompressed audio is deleted automatically.

Version1.1.1: button and field activations use a bright C6/E6 glass chime with a quiet octave overtone. Keyboard keys use a short D6 chime. Activation sounds are handled once on click, covering both touch and physical-keyboard activation. Disabled/inert controls are silent. The on-screen sound control has been removed; Ctrl+Shift+M remains available.
