# Catch the Phish 1.1.5

Hides the mouse pointer throughout the app for touchscreen use, including the background, buttons, registration fields, and on-screen keyboard. Touch, mouse clicks, typing, and operator shortcuts continue to work.

Removes the persistent **Rotate screen** button. Use **Shift+R** to rotate the game by 90° when you are not typing in a registration field, or **Command/Ctrl+Shift+R** at any time. A brief notice confirms the new angle for two seconds after a rotation, then disappears. It stays hidden on launch, including when restoring a saved orientation.

The existing desktop app has no cursor setting and bundles its interface inside the application, so this change requires replacing the app with this build. Close the old app completely before opening the new copy. On Mac, extract the ZIP and replace **Catch the Phish.app** in Applications. On Windows, extract the complete ZIP and open **Launch.cmd** or **Catch the Phish.exe**. Saved leaderboard scores and preferences remain in the same local data location.

## Downloads

- **Mac arm64 ZIP:** Apple Silicon Macs (M1 or newer). Uses a verified ad-hoc signature; see [Mac setup](https://github.com/idagcc/catch-the-phish/blob/main/docs/mac-setup.md) if macOS blocks the download.
- **Windows x64 ZIP:** Extract the complete folder before launching.
- **Web ZIP:** Extract and serve with a static web server.
- **SHA256SUMS.txt:** SHA-256 checksums for all three ZIPs.

## Validation

All 20 existing game, leaderboard, media, and display-policy checks pass, and the production build succeeds. Browser checks verify hidden cursors on the page, buttons, disabled buttons, registration fields, and on-screen keyboard; keyboard taps and typing still work. Rotation checks cover the brief confirmation, expiry, rapid repeated rotations, saved orientation after reload, and uppercase R entry without rotating. Both desktop packages contain the verified production interface, and the Mac app passes deep signature verification. ZIP integrity checks and SHA-256 checksums cover all three downloads. Native Windows execution and physical touchscreen calibration still require the target device.
