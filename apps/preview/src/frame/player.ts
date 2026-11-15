import '@videojs/html/video/player';
import '@/video/skin';
import skinTemplate from '@/video/skin.html?raw';

// Set VITE_DEMO_VIDEO_URL in .env.local to preview another browser-playable source.
const SRC = import.meta.env.VITE_DEMO_VIDEO_URL || 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/1080/Big_Buck_Bunny_1080_10s_1MB.mp4';
const POSTER = import.meta.env.VITE_DEMO_POSTER_URL || '/ankh-solar-poster.svg';
// Set VITE_MUX_PLAYBACK_ID only when a real public playback ID is available.
const MUX_PLAYBACK_ID = import.meta.env.VITE_MUX_PLAYBACK_ID?.trim();
if (MUX_PLAYBACK_ID) await import('@videojs/html/media/mux-video');

const MEDIA_PLACEHOLDER = '<!-- Add a compatible media component here. -->';

export function createPlayer(): HTMLElement {
  const player = document.createElement('video-player');
  const media = MUX_PLAYBACK_ID
    ? `<mux-video class="ankh-media" poster="${POSTER}" playsinline preload="auto"></mux-video>`
    : `<video class="ankh-media" src="${SRC}" poster="${POSTER}" playsinline preload="auto"></video>`;
  player.innerHTML = skinTemplate.replace(
    MEDIA_PLACEHOLDER,
    media
  );
  if (MUX_PLAYBACK_ID) {
    const mux = player.querySelector('mux-video') as (HTMLElement & { source: { playbackId: string } }) | null;
    if (mux) mux.source = { playbackId: MUX_PLAYBACK_ID };
  }

  return player;
}
