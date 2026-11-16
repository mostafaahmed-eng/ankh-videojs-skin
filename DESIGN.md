# ANKH design notes

## Concept

ANKH turns the sun's measured passage into a control surface for moving images. The visual language comes from instrument dials, precise alignment, and museum presentation. A curved solar-disc seek path supplies the Egyptian-futurist reference; the rest stays quiet, functional, and contemporary.

## Palette and type

| Token | Value | Use |
| --- | --- | --- |
| Obsidian | `#0B0D10` | Player field and control surface |
| Solar gold | `#D4AF37` | Seek fill, active states, small brand marks |
| Sandstone | `#E8DCC4` | Supporting text |
| Ivory | `#F5F3EF` | Primary controls and labels |

Player controls use system sans-serif fonts to avoid an unlicensed web-font dependency. Showcase headings use the system serif stack. Times use tabular numerals.

## Solar Timeline

The slider remains the official Video.js `media-time-slider`, with its slider track, buffered fill, progress fill, thumb, pointer preview, time display, and optional chapter template. Gold and sandstone separate played and buffered media. A small skin-side mapper positions the visual thumb on the responsive arc from the slider's published progress value; the real slider continues to own role, values, keyboard and touch input, drag seeking, pause-on-drag, and buffering state.

## Controls and state

The control shelf preserves official play, pause, replay, mute, volume, captions, playback-rate, PiP, and fullscreen behavior. Availability-based controls hide when the media cannot provide the feature. Native caption and chapter tracks remain configurable in the media element. Error and status components keep the official accessible behavior; localized component labels are not replaced with hardcoded UI copy.

## Media and poster

The production showcase uses the official Video.js v10 `@videojs/mux-video` HLS adapter with public playback ID `QlDrE00kgqfngiVLY01qa011sGYQFV1ftW7VARb4QSCZZA`. Mux Player and iframe embeds are not used. The original ANKH poster is supplied through Video.js `media-poster`, so provider-generated Mux thumbnails do not replace the approved artwork. The adapter allows automatic rendition selection up to 2160p while retaining adaptive playback for smaller viewports and limited bandwidth. The adapter uses hls.js where Media Source Extensions are available and its native-HLS delegate otherwise; this is the supported Safari/iOS path, though it has not been validated in a real Safari device here. A separate `/showcase.html?demo=audio` mode uses the official Video.js HLS.js/native-HLS adapter with the public AAC Big Buck Bunny stream. The silent MP4 excerpt remains the development fallback only.

The clickable production credit links to the Pexels page for “Stunning View of the Great Pyramids in Giza” by K. It is used under the Pexels License and is explicitly outside the Apache 2.0 license on the original ANKH code. The audio demo uses Big Buck Bunny, Blender Foundation, CC BY 3.0.

## Accessibility

- Focus uses a high-contrast gold ring with a dark offset.
- Controls use 44px targets, with the full timeline acting as the touch target.
- Control labels and slider semantics are supplied by Video.js components.
- Status changes use the Video.js status announcer.
- Controls sit on a mineral-textured obsidian shelf with a gradient scrim over the picture.
- Hover behavior is limited to fine pointers.
- Reduced-motion preferences simplify transitions and the buffer animation.
- Responsive container queries adapt the bar to embedded player width.

## Layout

The player is a 16:9 media surface with bottom-aligned controls and a broad timeline. At compact widths, the controls move below the video and wrap into an efficient shelf while preserving the solar arc and touch targets. Fullscreen returns the shelf to an overlay. The showcase keeps the player as the dominant artifact and leaves the design concept in one short explanatory note.

For the detailed implementation spec, see [`design/spec.md`](design/spec.md).
