# ANKH release verification

## Commands and browser results

- `npm run typecheck` — passed.
- `npm run build` — passed. The production bundle is in `dist/`; Vite reports the shared HLS.js adapter chunk above its 500 kB advisory threshold (about 634 kB raw / 195 kB gzip). It is dynamically imported for HLS playback.
- `npm run test:browser` — 33/33 passed: Chromium 11/11, Firefox 11/11, and WebKit 11/11.
- `@axe-core/playwright` WCAG 2.1 A/AA audit — zero reported violations in each engine.

All three browser projects verify the public HLS manifest and ANKH Mux source configuration. Chromium and Firefox play the Mux stream. This installed Playwright WebKit has neither MediaSource nor native HLS support; its Mux test verifies the public manifest and that the Video.js error dialog appears. To test the rest of the WebKit UI and touch interactions, the browser test harness substitutes the existing licensed MP4 only after detecting that platform capability gap. It does not change production media configuration.

## Mux asset evidence

- Playback ID: `QlDrE00kgqfngiVLY01qa011sGYQFV1ftW7VARb4QSCZZA`.
- Chromium and Firefox loaded and played the Mux HLS stream with the `@videojs/html` `mux-video` component; observed browser engine: `hlsjs`.
- Measured duration: approximately 21.438 seconds (the browser regression assertion allows 19–23 seconds for manifest variation).
- A Chromium browser session loaded master and rendition manifests with HTTP 200. Automated browser coverage verifies an HTTP 200 Mux manifest in every engine.
- Playback, pause, pointer/touch/keyboard seeking, solar-disc synchronization, buffering, mute/volume, playback speed, and fullscreen were exercised with actual Mux media in Chromium and Firefox.
- The stream reported 1280×720 in the exercised viewport; the source is configured with a 2160p maximum auto-resolution. This test does not prove that the 2160p rendition was selected or played.
- No caption, chapter, or audio rendition/track was exposed by the inspected media metadata. The captions button correctly remains unavailable; chapter rendering is separately covered using real Video.js chapter cues created by the test. Since no audio rendition was exposed, audible volume behavior cannot be confirmed for this asset.
- The separate Big Buck Bunny HLS audio demo was verified in Chromium and Firefox. Both loaded and played the public HLS stream; the variants advertise AAC (`mp4a.40.x`), and volume and mute state respond through ANKH controls. In WebKit without native HLS or MSE, the audio test verifies graceful error handling. No real Safari/iOS device test was performed.
- The Big Buck Bunny HLS demo reported a measured duration of 634.584 seconds during the production-preview browser check.
- The source uses the supplied public ID directly. The app has no production fallback path: a production build without `VITE_MUX_PLAYBACK_ID` throws. The Big Buck Bunny MP4 is available only for development and WebKit capability fallback in the test harness.

## Accessibility and responsive coverage

- Keyboard focus, Space play/pause, arrow-key seeking, slider role/name/value, visible focus, reduced-motion preferences, Escape from fullscreen, and fullscreen enter/exit are checked.
- Pointer preview timestamps, Dawn/Zenith/Dusk landmarks, mouse/touch/keyboard seeking, accurate seek state, and the curved solar-disc position are checked.
- Layout and touch targets are checked at 320, 375, 390, 768, 1024, and 1440 CSS pixels. The main player controls remain above the 1440×900 initial desktop fold.
- Axe checks, browser console/page errors, player error handling, chapter availability, and horizontal overflow are covered.
- This is automated browser and axe evidence; no physical-device or screen-reader test was performed.

## Screenshots

Captured from the Chromium browser run with the configured Mux source:

- `artifacts/final-desktop.png` — poster and initial player at desktop size.
- `artifacts/final-mobile.png` — compact 390px player.
- `artifacts/final-playing.png` — playing Mux footage and overlay controls.
- `artifacts/final-paused.png` — paused playback state.
- `artifacts/final-fullscreen.png` — fullscreen player.
- `artifacts/final-seeking.png` — timestamp preview and solar handle during seeking.
- `artifacts/final-keyboard-focus.png` — visible keyboard focus and tooltip.
- `artifacts/submission-hero.png` — clean player-only poster view.
- `artifacts/release-preview-local-desktop.png` — full static-build preview with the clickable Pexels credit.
- `artifacts/release-preview-audio-demo.png` — static-build audio demo showing the AAC Big Buck Bunny source and its separate credit.

All local screenshots were visually inspected. The playing capture shows the supplied footage; the hero capture shows the approved ANKH poster. These are local build captures; public production screenshots could not be captured because Vercel CLI is logged out and no deployment was made.

## Production build and release limits

- `npm run build` creates static files in `dist/`; `vercel.json` sets that output and rewrites `/` to `/showcase.html`.
- The built showcase is smoke-tested locally at `http://127.0.0.1:4173/showcase.html`; the Vercel root rewrite is host configuration and is not applied by Vite preview.
- No deployment was performed.
- The showcase now links the confirmed Pexels credit and license, and explicitly excludes that footage from the Apache code license.
- The tested WebKit runtime lacks MSE and native HLS. The Video.js adapter supports a browser-native HLS path, but no real Safari/iOS playback test was run.
- The WebKit mouse-drag compatibility path reapplies the final seek after the slider's pointer-up update, avoiding a snap-back to the previous time.
- Competition packaging and submission form requirements remain to be confirmed.
