# Catch the Phish

Offline portrait touchscreen quiz for Windows and Mac, based on the approved Figma flow.

## Downloads

The [latest release](https://github.com/idagcc/catch-the-phish/releases/latest) includes ready-to-run Windows x64 and Apple Silicon Mac ZIPs, the production web build ZIP, and SHA-256 checksums. The web build must be served from a static web server after extraction.

## Run on Windows

Download the Windows ZIP from the latest release, or use the locally built ZIP in `release/`. Extract the complete ZIP, then double-click `Launch.cmd` or `Catch the Phish.exe`. No Node.js installation or internet connection is required.

Set Windows display orientation to **Portrait**, ideally **2160 × 3840** (1080 × 1920 is also supported). The app chooses a portrait display automatically and fills it while preserving the approved 9:16 layout.

Press **Ctrl+Shift+Q** to close the game with a confirmation. **F11** switches between fullscreen and an operator window. **Ctrl+Shift+M** toggles sound.

## Run on Mac and rotate the game

On an Apple Silicon Mac (M1 or newer), download and extract the Mac ZIP from the latest release, move **Catch the Phish.app** to Applications, then open it. The app has an ad-hoc signature verified during packaging, but is not signed with an Apple Developer ID or notarized. If macOS blocks it, use **System Settings → Privacy & Security → Open Anyway** for this download. If it still reports this app as damaged, see [Mac setup](docs/mac-setup.md). From the source project, run `npm ci`, `npm run build`, then `npm start`. The game opens full screen on Mac too. Use **Command+Shift+Q** to close it with a confirmation, or **Command+Shift+M** to toggle sound.

Leave macOS display orientation set to **Landscape** when its portrait setting causes touchscreen problems. Tap **Rotate screen** at the top right of the home screen to rotate the entire game clockwise by 90°. Repeat to cycle through 90°, 180°, 270°, and upright. **Shift+R** also rotates the game on Mac and Windows when you are not typing in a registration field. Choose 90° or 270° to suit the way the physical touchscreen is mounted. The game scales to fit the rotated dimensions, including its keyboard, and touch/click targets rotate with the controls. The chosen orientation is remembered on this computer after returning home or reopening the app.

On a display that is physically landscape, upright mode keeps the portrait game centered with space at the sides. Rotating the game makes its image sideways so a physically portrait-mounted display can still use the operating system's landscape setting. This setting rotates only the game; macOS and other apps keep their existing orientation.

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
- Registration, instructions, quizzes, and results return to the home screen after 30 seconds without a tap or keypress. Each interaction restarts the timer; abandoned sessions clear the player's details and unfinished round.

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
npm run test:desktop
npm run build
npm start -- --windowed
npm run package:win
npm run package:mac
```

See `docs/windows-setup.md` for operation and backup instructions. The native Windows app uses a stable `ctphish://app` origin and a fixed user data directory so moving or extracting the app into another folder does not change its saved leaderboard.

## Validation

The production build, 11 automated game/leaderboard tests, and seven local-media streaming tests pass. A complete browser round verified 10 distinct questions, the expected 7/10 result, touchscreen entry, and leaderboard persistence after reload. The offline desktop wrapper was launched successfully on macOS. The Windows package must still be checked on the target Windows touchscreen; physical touch calibration and Windows display settings cannot be verified from this Mac.

Version 1.1 adds the supplied video, motion and audio. See `docs/audio-notes.md` for the original score and `docs/media-validation.md` for playback checks.

Version1.1.1 removes the sound banner and adds clearer glass chimes to button, field, and answer activations, with softer chimes for keyboard keys. Ctrl+Shift+M remains the operator mute shortcut.

Version 1.1.2 adds saved app rotation in 90° steps, an Apple Silicon Mac download, a 30-second inactivity timeout, and the simplified fourth instruction: “Be accurate and quick.”

Version 1.1.3 repairs Mac app signing and checks the app and nested signatures before creating a download archive. Apple Developer ID signing and notarization are still required for distribution without manual macOS approval.

Version 1.1.4 fixes repeated Mac fullscreen transitions caused by Dock/menu-bar work-area changes, adds a home-screen rotation button, and simplifies the rotation shortcut to Shift+R. Mac now uses native fullscreen; Windows retains kiosk mode.
