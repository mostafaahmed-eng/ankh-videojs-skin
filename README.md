# ANKH — The Art of Time

ANKH is a reusable Video.js v10 HTML skin. It builds on the official Video.js CLI standalone skin workbench and composes Video.js UI custom elements for accessible, state-driven controls.

## Run locally

```sh
npm install
npm run dev
```

The official workbench opens at the printed URL (normally `http://localhost:5173/`). The premium showcase is at `/showcase.html` (normally `http://localhost:5173/showcase.html`).

## Configure media

The preview uses a 10-second, 1080p MP4 excerpt from Blender Foundation's Big Buck Bunny by default. Change it without editing source by creating `.env.local`:

```dotenv
VITE_DEMO_VIDEO_URL=https://your-cdn.example/video.mp4
VITE_DEMO_POSTER_URL=/your-poster.jpg
```

Restart Vite after changing these values. Supply a browser-playable source URL and optional poster URL. For Mux playback, add the relevant Video.js media adapter and replace the native `<video>` in `apps/preview/src/frame/player.ts` with the adapter element. To use captions or chapters, add real `<track kind="captions">` or `<track kind="chapters">` sources to the media element; the skin's controls react to track availability.

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

## License

Original ANKH submission code is licensed under Apache License 2.0. Video.js and other dependencies retain their own licenses. The demo footage remains under CC BY 3.0 and is served from Blender's download host; it is not included in this repository.

See [DESIGN.md](DESIGN.md), [TEST-REPORT.md](TEST-REPORT.md), and [SUBMISSION-CHECKLIST.md](SUBMISSION-CHECKLIST.md).
