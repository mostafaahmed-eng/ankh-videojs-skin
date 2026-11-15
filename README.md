# ANKH — The Art of Time

ANKH is a reusable Video.js v10 HTML skin. It builds on the official Video.js CLI standalone skin workbench and composes Video.js UI custom elements for accessible, state-driven controls.

## Run locally

```sh
npm install
npm run dev
```

The official workbench opens at the printed URL (normally `http://localhost:5173/`). The premium showcase is at `/showcase.html` (normally `http://localhost:5173/showcase.html`).

## Configure media

The showcase uses the public Mux asset configured in the root `.env` file. `VITE_MUX_PLAYBACK_ID` is a public playback identifier, not a private API credential. The Vite config reads that root file through `envDir`, so development and production builds use the same asset. Production code refuses to silently select the demo if the Mux ID is missing.

The licensed 10-second Big Buck Bunny MP4 remains available as a development fallback if the Mux ID is unset. Change fallback source and poster URLs without editing source by creating `.env.local`:

```dotenv
VITE_DEMO_VIDEO_URL=https://your-cdn.example/video.mp4
VITE_DEMO_POSTER_URL=/your-poster.jpg
```

Restart Vite after changing environment values. The showcase uses official Video.js v10 `@videojs/mux-video`, public playback ID `QlDrE00kgqfngiVLY01qa011sGYQFV1ftW7VARb4QSCZZA`, and the unchanged ANKH solar poster. It does not use Mux Player or an iframe. The MP4 fallback is available only when the Mux ID is absent in development. To use captions or chapters, add accurate real caption or chapter tracks; the skin controls respond to track availability.

## Skin architecture

- `src/video/skin.html` composes the player container, real Video.js controls, seek slider, state indicators, error dialog, status announcer, shortcuts, and gestures.
- `src/video/skin.ts` explicitly registers each Video.js v10 custom element used by that composition.
- `src/video/skin.css` defines layout, interaction states, focus, contrast, and responsive behavior.
- `src/video/solar-trajectory.svg` draws the responsive mask used for the arc and its instrument graduations.
- `src/video/theme.css` contains reusable design tokens.
- `apps/preview/` contains the official CLI workbench and the ANKH showcase route. The skin source in `src/` can move into a consuming application.

The Solar Arc uses Video.js `media-time-slider`, slider parts, chapter support, and time previews. The accessible Video.js slider remains the source of position, buffering, seeking, keyboard interaction, and slider semantics. Skin code follows its published fill value to place the visual solar disc on the responsive quadratic arc; an SVG mask draws the curve, graduations, and played, buffered, and unplayed states. The full-width slider remains the actual input. Its translated `Seek` label and time value come from Video.js. Native Video.js tooltips follow button names and state. Optional controls hide automatically when the attached media does not support the feature.

## Supported controls

Play/pause/replay, accurate seek and buffered progress, current and total time, mute, volume, playback rate, captions when text tracks exist, PiP and fullscreen when supported, loading feedback, and the Video.js error dialog. Chapter markers render when a chapter track is supplied. The player retains Video.js keyboard state announcements and adds Space, left/right seek, mute, and double-tap gestures.

## Demo media and attribution

Big Buck Bunny is an open movie by Blender Foundation, licensed under Creative Commons Attribution 3.0. The preview streams a short MP4 excerpt from [Test Videos](https://test-videos.co.uk/bigbuckbunny/mp4-h264); the film is the Blender Foundation's open movie. The official project states the film and project data may be reused with attribution. The showcase credits: **© copyright 2008, Blender Foundation / www.bigbuckbunny.org**. Source: [official download page](https://peach.blender.org/download/) and [license details](https://peach.blender.org/about/).

The production showcase plays **ANKH — A Journey Through Time** from the supplied public Mux playback ID. No creator, copyright, or license credit for this footage has been supplied; add any required credit before public release. Big Buck Bunny attribution remains for the development fallback and preview workbench.

## Production and deployment

The Vite production command is `npm run build`; static output goes to `dist/`. `vercel.json` configures this and rewrites the production root URL to `/showcase.html`. See [DEPLOYMENT.md](DEPLOYMENT.md) for Vercel setup. Do not add private Mux keys to client environment variables; the public playback ID is safe in the static bundle.

## License

Original ANKH submission code is licensed under Apache License 2.0. Video.js and other dependencies retain their own licenses. The demo footage remains under CC BY 3.0 and is served from Blender's download host; it is not included in this repository.

See [DESIGN.md](DESIGN.md), [TEST-REPORT.md](TEST-REPORT.md), [SUBMISSION-CHECKLIST.md](SUBMISSION-CHECKLIST.md), and [DEPLOYMENT.md](DEPLOYMENT.md).
