# Version 1.1 media and motion validation

- Source: DGE_BG_Potrite.mp4, 2160 × 3840 H.264, 30fps, 10 seconds, no audio. Delivery copy preserves encoded frames and moves MP4 metadata to the front for local playback.
- Persistent video element verified at readyState4, 2160×3840, advancing time and playing after the full round.
- Original 48-second stereo electronic score stored locally as Opus in Ogg. Hidden audio element verified playing, AudioContext running, exactly one music track throughout all10 questions.
- Mute toggled, reloaded, and verified retained with no audio element started while muted. Unmute resumed playback.
- Page entry420ms/exit200ms overlap; quiz entry220ms/exit120ms overlap. Same-scene updates preserve input focus and do not restart animation.
- Neon breathing and button press feedback are CSS animations; reduced-motion settings disable them and use the video poster.
- Full browser round used10 distinct questions, with the first two intentionally wrong. Result8/10 matched expectations. Wall time19.1 seconds, displayed answer time00:01: feedback and entrance time were excluded.
- Development QA used127.0.0.1 storage, separate from the event preview atlocalhost and the native app.
- Eleven game/leaderboard tests and seven media-range tests pass. Physical Windows playback and speaker volume remain target-machine checks.

Version1.1.1: visible sound banner removed in source, live preview and packaged JS/CSS. Physical Enter activation opens registration, field tap opens the touch keyboard, and a touch key enters text with one active audio graph in running state. Production build plus18 existing tests pass; Windows ZIP CRC and current asset hashes verified.
