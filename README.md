# Catch the Phish

Offline quiz for a 65-inch Windows touchscreen in portrait orientation, based on the approved Figma flow.

## Downloads

The [latest release](https://github.com/idagcc/catch-the-phish/releases/latest) includes the ready-to-run Windows x64 ZIP, the production web build ZIP, and SHA-256 checksums. The web build must be served from a static web server after extraction.

## Run on Windows

Download the Windows ZIP from the latest release, or use the locally built ZIP in `release/`. Extract the complete ZIP, then double-click `Launch.cmd` or `Catch the Phish.exe`. No Node.js installation or internet connection is required.

Set Windows display orientation to **Portrait**, ideally **2160 × 3840** (1080 × 1920 is also supported). The app chooses a portrait display automatically and fills it while preserving the approved 9:16 layout.

Press **Ctrl+Shift+Q** to close the game with a confirmation. **F11** switches between fullscreen and an operator window. **Ctrl+Shift+M** toggles sound.

## Game

- Registration with name and email, including a touchscreen keyboard.
- Supplied 4K portrait background film loops continuously across pages.
- Neon board breathing, overlapping page transitions, and faster question transitions.
- Original 48-second looping electronic score with tap, keyboard, transition, correct/incorrect, and completion sounds.
- Ctrl+Shift+M mutes/unmutes. There is no on-screen sound banner. The preference is saved. Music starts automatically in the Windows kiosk and after the first interaction in browsers. It becomes quieter during questions and pauses when the page is hidden.
- 10 random questions from the supplied 50-question bank: five legitimate and five phishing, without repeats within a round.
- Correct/incorrect border feedback lasts 1.5 seconds, then the next question appears.
- Rankings use correct answers first, then the sum of answer times in milliseconds. Feedback, loading, and entrance-animation time are excluded.
- The top 1,000 scores remain on the same Windows computer between launches. Email addresses are stored locally and are never displayed on the leaderboard.
- Results return to the start screen after 20 seconds. Abandoned registration resets after 90 seconds; abandoned quizzes reset after three minutes without input.

The question image uses the message crop shown in the approved Figma card. Original uncropped source files remain in `public/quiz/`, with the answer key and provenance in `data/questions.json`.

## Source project

Requires Node.js 22 or newer.

```sh
npm ci
npm run dev
```

Preview: http://localhost:5185

```sh
npm test
npm run build
npm start -- --windowed
npm run package:win
```

See `docs/windows-setup.md` for operation and backup instructions. The native Windows app uses a stable `ctphish://app` origin and a fixed user data directory so moving or extracting the app into another folder does not change its saved leaderboard.

## Validation

The production build, 11 automated game/leaderboard tests, and seven local-media streaming tests pass. A complete browser round verified 10 distinct questions, the expected 7/10 result, touchscreen entry, and leaderboard persistence after reload. The offline desktop wrapper was launched successfully on macOS. The Windows package must still be checked on the target Windows touchscreen; physical touch calibration and Windows display settings cannot be verified from this Mac.

Version 1.1 adds the supplied video, motion and audio. See `docs/audio-notes.md` for the original score and `docs/media-validation.md` for playback checks.

Version1.1.1 removes the sound banner and adds clearer glass chimes to button, field, and answer activations, with softer chimes for keyboard keys. Ctrl+Shift+M remains the operator mute shortcut.
