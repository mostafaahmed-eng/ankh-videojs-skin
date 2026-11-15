# ANKH design specification

## Direction

ANKH translates the sun's measured path into a focused media control surface. Obsidian establishes the viewing field; sandstone typography and a single solar-gold accent carry hierarchy. The interface uses instrument-like alignment, fine rules, and a circular seek thumb with a small inner disc. It avoids literal Egyptian ornament.

## Layout and order

- A responsive 16:9 video surface with a low instrument shelf: a fine solar-gold datum, restrained mineral striation, and no enclosing rectangular card border.
- A full-width solar timeline sits above the primary controls. Its measured path rises into a shallow arch, with a precise lower time scale, fine graduations, and separate unplayed, buffered, and played states. A gold solar disc follows the curve. The full-width Video.js slider remains the real input and supplies a large touch target.
- Primary row: play/pause, elapsed and total time, flexible space, mute and volume slider, speed, captions when tracks exist, PiP when supported, fullscreen.
- A restrained centered play affordance appears only before playback starts and after end; the primary play control uses a solar ring, and all actions remain official Video.js UI components.
- A compact responsive editorial header keeps the live player controls visible near the top of a typical desktop viewport.
- Chapter markers appear only when a chapters text track exists.

## Controls and states

The controls are composed from Video.js v10 HTML custom elements. The player owns all media state. Buffering, errors, paused, ended, and seeking states follow the component data attributes. Feature controls rely on Video.js availability state and hide when unsupported. The captions button appears only when a captions/subtitles track exists. Speed cycles through supported rates.

## Typography and icons

System sans-serif for controls and a restrained editorial serif for the page title. Time values use tabular numerals. Icons are a coherent custom set of inline outline SVGs, 24-unit viewBox, 1.8-unit stroke, round caps and joins.

## Tokens

- Obsidian `#0B0D10`
- Solar gold `#D4AF37`
- Sandstone `#E8DCC4`
- Ivory `#F5F3EF`
- Accessible control text uses ivory; gold is reserved for progress and active states.

All reusable colors, spacing, radii, focus, and motion values are CSS custom properties. Buttons have minimum 44px touch targets. Focus uses a high-contrast double ring. Motion is short and collapses under reduced-motion preferences.

## Responsive behavior

The player uses container-width rules, not viewport assumptions. At narrow sizes, time readout tightens, volume slider and speed control collapse from the visual row while accessible native controls remain available only when their feature exists; primary play, mute, captions, PiP, and fullscreen targets stay at least 44px. No controls overlap or clip.

## Derived implementation choices

- Native system fonts avoid an unlicensed font dependency.
- A translucent obsidian scrim preserves control contrast across variable video frames; the shelf uses only a fine upper rule and subtle mineral striation.
- The arc is a decorative rendering of the same linear media time scale; the Video.js slider remains underneath so pointer, touch, and keyboard seeking share exact state and semantics.
- Ankh symbolism appears in the circular solar-disc seek thumb and the slim vertical axis in the wordmark, without decorative glyphs.
