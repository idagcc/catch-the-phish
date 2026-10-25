# Catch the Phish — Windows touchscreen setup

## Start the game

1. Copy the Windows ZIP to the touchscreen PC and extract the entire folder.
2. In Windows Settings → System → Display, select the 65-inch touchscreen, set Display orientation to Portrait, and use the display's native resolution (2160 × 3840 for a 4K panel).
3. Double-click `Launch.cmd` in the extracted folder. You can also open `Catch the Phish.exe` directly.

The game runs entirely from the included files. An internet connection, Node.js, and a web server are not required. Keep the extracted folder intact.

## Touchscreen and display

The game opens full screen on the largest connected portrait display. If no portrait display is present, it opens on the primary display. Set the orientation in Windows before opening the game. The app follows display rotation and reconnects.

Touch the answer buttons once. Each question accepts one answer. Quiz images, fonts, background video, music, and sound effects are included locally.

Tap **Rotate screen** at the top right of the home screen to rotate the game in 90° steps. The choice is remembered, and the button stays upright in every orientation.

If Windows sends touches to another monitor, use Control Panel → Tablet PC Settings → Setup to associate touch input with the portrait display. Windows must already recognize the touchscreen driver.

## Operator controls

- `Ctrl + Shift + Q`: show the close-game confirmation.
- `Ctrl + Shift + M`: mute or unmute music and sound effects.
- `Shift + R`: rotate the game clockwise by 90° when you are not typing in a registration field. The chosen orientation is remembered. If operating-system rotation causes touch problems, keep Windows in Landscape and rotate the game to match the physically mounted touchscreen instead.
- `F11`: switch between the full-screen game and a testing window.
- To test the app in a window from a command prompt: `"Catch the Phish.exe" --windowed`.

The game prevents the display from sleeping while it is open. Windows system shortcuts continue to work; the app is not a Windows Assigned Access replacement.

The animated background loops silently. Music and game sounds play through the Windows audio output. Set the PC's speaker volume before the event; the keyboard mute control affects the game audio.

## Scores

Leaderboard scores stay on this Windows account and computer between launches, in the app's local data under `%APPDATA%\Catch the Phish`. Copying the app to another computer does not copy the leaderboard. Keep the same Windows account for an event.

## Build from source

Install a supported Node.js release, run `npm ci`, then `npm run package:win`. Outputs appear in `release`. The Windows ZIP includes a launcher and this guide. The app is built for Windows x64.

An optional single-file portable executable can be built on Windows with `npx electron-builder --win portable --x64 --config electron-builder.yml`. The ZIP is the standard delivery and runs without installation.

## Before the event

Run one full round on the actual touchscreen, verify that taps select the intended buttons, confirm the background loops and sounds play at a comfortable volume, close and reopen the game to confirm the leaderboard remains, and check the portrait orientation after a PC restart.
