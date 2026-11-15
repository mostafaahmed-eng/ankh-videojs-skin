# ANKH 2.0 test report

## Verification

- `npm run typecheck` — passed.
- `npm run build` — passed.
- `npm run test:browser` — passed, 15 tests across Chromium, Firefox, and WebKit (5 per engine).
- Playwright tests desktop Chromium, Firefox, and WebKit. Chromium captures the six requested screenshots.

## Coverage

- Showcase layout and overflow at 320, 375, 390, 768, 1024, and 1440 CSS pixels; main controls remain above the 1440 × 900 desktop fold.
- Real playback, pause, pointer click and drag seeking, buffered progress, solar-disc alignment to actual current time and curved path, timeline time preview, keyboard slider semantics and seeking, touch emulation at 390px, volume, playback rate, captions availability, chapters generated from live Video.js cues, reduced motion, focus-visible, dynamic play tooltip, and fullscreen enter/exit.
- Browser tests collect page and console errors.
- A WebKit-only mouse-drag fallback is exercised by the cross-browser drag test; Video.js slider state and ARIA remain the source for the thumb and seek semantics.

## Screenshots

- `artifacts/v2-desktop.png`
- `artifacts/v2-mobile.png`
- `artifacts/v2-playing.png`
- `artifacts/v2-paused.png`
- `artifacts/v2-fullscreen.png`
- `artifacts/v2-keyboard-focus.png`

## Comparison with the baseline

The baseline `artifacts/desktop.png` shows a straight progress rail, full rectangular control panel, and a two-line oversized heading. The v2 screenshots show the live solar arc and position disc, fine time graduations, a borderless instrument shelf, and a one-line heading. The player now fits with its main controls inside the initial 1440 × 900 desktop viewport.

## Known limits

- The hosted Video.js Scaffold registry request at `https://shadcn.videojs.org` timed out during initial setup. The project uses the official CLI workbench and documented Video.js components, with skin source authored locally.
- The demo remains the externally hosted, 10-second Big Buck Bunny excerpt. No replacement footage was provided or made.
- The default media has no caption or chapter tracks. Caption and chapter UI are tested with availability and synthetic in-memory chapter cues.
- Browser tests cover Playwright's desktop Chromium, Firefox, and WebKit builds, with emulated touch input. Physical devices and assistive technology/screen-reader behavior are not covered by automation.
