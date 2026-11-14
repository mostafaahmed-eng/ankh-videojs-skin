import '@videojs/html/video/player';
import '@/video/skin';
import skinTemplate from '@/video/skin.html?raw';

// Set VITE_DEMO_VIDEO_URL in .env.local to preview another browser-playable source.
const SRC = import.meta.env.VITE_DEMO_VIDEO_URL || 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/1080/Big_Buck_Bunny_1080_10s_1MB.mp4';
const POSTER = import.meta.env.VITE_DEMO_POSTER_URL || '/ankh-solar-poster.svg';

const MEDIA_PLACEHOLDER = '<!-- Add a compatible media component here. -->';

export function createPlayer(): HTMLElement {
  const player = document.createElement('video-player');
  player.innerHTML = skinTemplate.replace(
    MEDIA_PLACEHOLDER,
    `<video class="ankh-media" src="${SRC}" poster="${POSTER}" playsinline preload="auto"></video>`
  );

  return player;
}
