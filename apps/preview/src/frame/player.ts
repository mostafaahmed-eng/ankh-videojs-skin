import '@videojs/html/video/player';
import '@/video/skin';
import skinTemplate from '@/video/skin.html?raw';

// Set VITE_DEMO_VIDEO_URL in .env.local to preview another browser-playable source.
const SRC = import.meta.env.VITE_DEMO_VIDEO_URL || 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/1080/Big_Buck_Bunny_1080_10s_1MB.mp4';
const POSTER = import.meta.env.VITE_DEMO_POSTER_URL || '/ankh-solar-poster.svg';
// The public release playback ID is configured in .env; leave it blank only for local fallback work.
const MUX_PLAYBACK_ID = import.meta.env.VITE_MUX_PLAYBACK_ID?.trim();
if (import.meta.env.PROD && !MUX_PLAYBACK_ID) {
  throw new Error('VITE_MUX_PLAYBACK_ID is required for production showcase builds.');
}
if (MUX_PLAYBACK_ID) await import('@videojs/html/media/mux-video');

const MEDIA_PLACEHOLDER = '<!-- Add a compatible media component here. -->';
const POSTER_PLACEHOLDER = '<!-- ANKH poster image -->';

export function createPlayer(): HTMLElement {
  const player = document.createElement('video-player');
  const media = MUX_PLAYBACK_ID
    ? `<mux-video class="ankh-media" crossorigin="anonymous" playsinline preload="auto"></mux-video>`
    : `<video class="ankh-media" src="${SRC}" poster="${POSTER}" playsinline preload="auto"></video>`;
  player.innerHTML = skinTemplate
    .replace(MEDIA_PLACEHOLDER, media)
    .replace(POSTER_PLACEHOLDER, `<img src="${POSTER}" alt="" />`);
  if (MUX_PLAYBACK_ID) {
    const mux = player.querySelector('mux-video') as (HTMLElement & {
      source: { playbackId: string; maxAutoResolution: '2160p' };
    }) | null;
    if (mux) mux.source = { playbackId: MUX_PLAYBACK_ID, maxAutoResolution: '2160p' };
  }

  return player;
}
