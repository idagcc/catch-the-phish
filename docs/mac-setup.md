# Mac setup

The Mac download supports Apple Silicon (M1 or newer).

1. Download the latest Mac ZIP from this repository's GitHub releases and extract it with Finder.
2. Move **Catch the Phish.app** into **Applications** and open it.
3. If macOS blocks the app, open **System Settings → Privacy & Security** and select **Open Anyway** for Catch the Phish.

The app uses an ad-hoc signature. Packaging verifies both the app and nested code signatures. It does not have an Apple Developer ID signature and is not notarized, so macOS can still block a downloaded copy.

## If macOS still says the app is damaged

Version 1.1.2 had an invalid app signature; replace that download with 1.1.3 or newer first.

For a copy downloaded directly from this repository's release, after moving it to Applications, check its integrity in Terminal:

```sh
codesign --verify --deep --strict "/Applications/Catch the Phish.app"
```

If verification succeeds (no output), remove the download quarantine flag from this app only, then open it:

```sh
xattr -dr com.apple.quarantine "/Applications/Catch the Phish.app"
open "/Applications/Catch the Phish.app"
```

This does not change Gatekeeper settings or other apps. If signature verification fails, use a fresh release download instead of proceeding.

## Rotation

Keep macOS in Landscape. On the home screen, tap **Rotate screen** at the top right until the game matches the physically mounted touchscreen. This button stays upright and visible in every orientation. **Shift+R** also rotates the game when you are not typing in a registration field. The game remembers your choice. **Command+Shift+M** toggles audio.

Version 1.1.4 also fixes repeated fullscreen flashing caused by Dock/menu-bar changes in earlier Mac versions. Close the older app completely before opening the replacement.
