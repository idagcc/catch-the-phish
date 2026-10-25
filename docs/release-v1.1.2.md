# Catch the Phish 1.1.2

**Mac users: use [version 1.1.3 or newer](https://github.com/idagcc/catch-the-phish/releases/latest).** The 1.1.2 Mac package has an invalid signature and can trigger a “damaged” alert. Version 1.1.3 repairs the signature; manual macOS approval may still be required.

Rotate the portrait game inside a landscape desktop, including the touchscreen keyboard and touch targets. Press **Command+Shift+R** on Mac or **Ctrl+Shift+R** on Windows to cycle through 0°, 90°, 180°, and 270°. The app remembers the orientation after returning home or reopening.

Keep the operating system in Landscape and use 90° or 270° when the physical touchscreen is mounted in portrait. The game rotates independently of the desktop.

This release also changes the fourth How to Play instruction to **Be accurate and quick** and returns abandoned sessions to the home screen after **30 seconds** without a tap or keypress. Player details and unfinished rounds are cleared on timeout; completed leaderboard scores are retained.

## Downloads

- **Mac arm64 ZIP:** For Apple Silicon Macs (M1 or newer). Extract it and open **Catch the Phish.app**. This app is unsigned and not notarized. If macOS blocks it, allow this download in **System Settings → Privacy & Security → Open Anyway**.
- **Windows x64 ZIP:** Extract the complete folder and open **Launch.cmd** or **Catch the Phish.exe**. Keep the files together.
- **Web ZIP:** Extract and serve the folder with a static web server.
- **SHA256SUMS.txt:** SHA-256 checksums for the three ZIP downloads.

All media, fonts, questions, sounds, and the touchscreen keyboard are included in the desktop apps. No Node.js installation or internet connection is required to play.

## Validation

The production build and all 18 automated game, leaderboard, and media checks pass. Browser checks cover all four rotations, matching touch targets, rotated keyboard input, answer selection, resizing, saved orientation, and inactivity cleanup. The Apple Silicon Mac app was launched and its rotation shortcut and saved orientation were checked. Native Windows execution and physical touch accuracy remain checks for the target touchscreen.
