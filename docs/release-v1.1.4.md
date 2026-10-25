# Catch the Phish 1.1.4

Fixes repeated fullscreen flashing on Mac and adds a visible **Rotate screen** button at the top right of the home screen. Tap it until the game matches the way the physical touchscreen is mounted; the button stays upright in every orientation. Keep macOS display orientation set to Landscape.

Mac now uses native fullscreen. Dock/menu-bar work-area changes no longer cause the app to exit and re-enter fullscreen. Actual display resolution, scaling, and rotation changes still update the layout.

**Shift+R** rotates the game on both Mac and Windows. Held-key repeats are ignored, and the chosen rotation is remembered. While typing in a registration field, Shift+R enters an uppercase R without rotating the game. The previous Command/Ctrl+Shift+R shortcuts also remain available.

Close the old app completely before opening the new copy. Extract the Mac ZIP and replace **Catch the Phish.app** in Applications. The Mac build uses a verified ad-hoc signature and is not Apple-notarized; see [Mac setup](https://github.com/idagcc/catch-the-phish/blob/main/docs/mac-setup.md) if macOS blocks the download.

## Downloads

- **Mac arm64 ZIP:** Apple Silicon Macs (M1 or newer).
- **Windows x64 ZIP:** Extract the complete folder and run **Launch.cmd** or **Catch the Phish.exe**.
- **Web ZIP:** Extract and serve with a static web server.
- **SHA256SUMS.txt:** SHA-256 checksums for all three ZIPs.

## Validation

All 20 automated game, leaderboard, media, and display-policy checks pass. Browser touch checks cover the visible button at all four rotations, keyboard input, answer selection, resizing, inactivity cleanup, and saved orientation. Native Mac checks cover fullscreen stability during repeated Dock/menu work-area notifications, button and shortcut rotation, and held-key repeat handling. Physical touch accuracy and native Windows execution remain target-machine checks.
