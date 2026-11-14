# Test report

This report records commands and observed results from the local workbench and showcase.

## Setup

- Official CLI: `@videojs/cli@10.4.0`
- Skin setup: `npx @videojs/cli@10.4.0 skin create . --name ankh --framework html --base scaffold --preset video --package-manager npm`
- The hosted Video.js skin registry request timed out in this environment. The CLI was rerun with its documented local `--registry` option and the CLI's bundled workbench templates; the resulting project retains the official `skin.json`, workbench, and Vite configuration. See known limitations below.
- Dependencies installed: `npm install` — completed; 0 vulnerabilities reported.
- Removed unused `@videojs/mux-video` after switching the preview to the configurable native MP4 source.

## Commands

Results:

- `npm run typecheck` — passed.
- `npm run build` — passed; Vite produced the workbench and showcase production assets.
- `npm run test:browser` — passed, 3 browser tests in installed Google Chrome via Playwright.

## Browser verification

Verified at 320, 375, 390, 768, 1024, and 1440 CSS pixels. The suite checked horizontal overflow, control target sizes, play/pause, playback progress, seeking, mute, playback speed, optional captions visibility, keyboard seeking/focus, reduced motion, volume keyboard input, and fullscreen entry/exit. No page errors or console errors were reported. Screenshots:

- `artifacts/desktop.png`
- `artifacts/mobile.png`
- `artifacts/paused.png`
- `artifacts/playing.png`
- `artifacts/keyboard-focus.png`

Playwright uses the installed Google Chrome channel; Playwright's bundled Chromium is not installed in this environment.

## Limitations

- The official registry host `https://shadcn.videojs.org` timed out while the CLI attempted to retrieve the Scaffold source item. The project uses the CLI's official standalone workbench generator with a locally supplied source item; all player UI is composed from documented Video.js v10 components, but this source was authored locally rather than copied from the hosted Scaffold registry.
- The short demo excerpt is externally hosted by Test Videos. Playback depends on that URL remaining available and on the visitor having network access.
- Captions and chapter controls are availability-driven; the default demo has no authored caption or chapter track.
- Verification covers Google Chrome only. Firefox, Safari, physical mobile devices, and screen reader behavior were not tested.
