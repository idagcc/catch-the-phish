# Catch the Phish 1.1.3

Fixes the invalid Mac app signature in 1.1.2. Mac packaging now applies an ad-hoc signature with the Electron runtime entitlements and verifies the app and all nested code before creating the ZIP.

The app is **not Apple Developer ID signed or notarized**. macOS may still require manual approval after downloading. Extract the new Mac ZIP with Finder, move **Catch the Phish.app** to Applications, and use **System Settings → Privacy & Security → Open Anyway** if prompted. If it still reports the app as damaged, follow the app-specific verification and quarantine steps in [Mac setup](https://github.com/idagcc/catch-the-phish/blob/main/docs/mac-setup.md).

The rotation shortcut (**Command+Shift+R** on Mac, **Ctrl+Shift+R** on Windows), saved orientation, 30-second inactivity timer, and revised instructions are included. Gameplay is unchanged from 1.1.2.

## Downloads

- **Mac arm64 ZIP:** Apple Silicon Macs (M1 or newer).
- **Windows x64 ZIP:** Extract the full folder and run **Launch.cmd** or **Catch the Phish.exe**.
- **Web ZIP:** Extract and serve using a static web server.
- **SHA256SUMS.txt:** SHA-256 checksums for the three ZIPs.

## Validation

All 18 automated game, leaderboard, and media checks pass. Strict verification of the Mac app and nested code signatures passes both before archiving and after extracting the ZIP. The extracted Mac app launches, rotates with Command+Shift+R, and retains the chosen orientation after reload. Gatekeeper approval is still required for downloaded copies because the app is not Developer ID signed or notarized. Native Windows execution and physical touchscreen checks remain target-machine checks.
