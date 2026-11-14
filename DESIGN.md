# ANKH design notes

## Concept

ANKH turns the sun's measured passage into a control surface for moving images. The visual language comes from instrument dials, precise alignment, and museum presentation. A solar-disc seek handle supplies the Egyptian-futurist reference; the rest stays quiet, functional, and contemporary.

## Palette and type

| Token | Value | Use |
| --- | --- | --- |
| Obsidian | `#0B0D10` | Player field and control surface |
| Solar gold | `#D4AF37` | Seek fill, active states, small brand marks |
| Sandstone | `#E8DCC4` | Supporting text |
| Ivory | `#F5F3EF` | Primary controls and labels |

Player controls use system sans-serif fonts to avoid an unlicensed web-font dependency. Showcase headings use the system serif stack. Times use tabular numerals.

## Solar Timeline

The slider remains the official Video.js `media-time-slider`, with its slider track, buffered fill, progress fill, thumb, pointer preview, time display, and optional chapter template. The round solar handle marks the live position; gold and sandstone separate played and buffered media. The visible track is thin, while the component keeps a larger interactive hit area. The role, values, keyboard seek, drag seeking, pause-on-drag, and buffering state come from Video.js.

## Controls and state

The control shelf preserves official play, pause, replay, mute, volume, captions, playback-rate, PiP, and fullscreen behavior. Availability-based controls hide when the media cannot provide the feature. Native caption and chapter tracks remain configurable in the media element. Error and status components keep the official accessible behavior; localized component labels are not replaced with hardcoded UI copy.

## Accessibility

- Focus uses a high-contrast gold ring with a dark offset.
- Controls use at least 40px targets, with 44px primary desktop targets.
- Control labels and slider semantics are supplied by Video.js components.
- Status changes use the Video.js status announcer.
- Controls sit on an opaque obsidian shelf with a gradient scrim over the picture.
- Hover behavior is limited to fine pointers.
- Reduced-motion preferences simplify transitions and the buffer animation.
- Responsive container queries adapt the bar to embedded player width.

## Layout

The player is a 16:9 container with bottom-aligned controls and a broad timeline. At compact widths, secondary volume and playback-rate widgets yield space to the seeking and core actions. The showcase keeps the player as the dominant artifact and leaves the design concept in one short explanatory note.

For the detailed implementation spec, see [`design/spec.md`](design/spec.md).
