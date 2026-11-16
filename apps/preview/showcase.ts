import './showcase.css';
import { createPlayer } from './src/frame/player';

const audioDemo = new URLSearchParams(window.location.search).get('demo') === 'audio';
const muxConfigured = Boolean(import.meta.env.VITE_MUX_PLAYBACK_ID?.trim());
const showsBigBuckBunny = audioDemo || !muxConfigured;
if (showsBigBuckBunny) {
  const section = document.querySelector<HTMLElement>('#showcase-player-section');
  if (section) section.setAttribute('aria-label', audioDemo ? 'Big Buck Bunny audio controls demo' : 'Big Buck Bunny development preview');
  const title = document.querySelector<HTMLElement>('#media-caption-title');
  if (title) {
    title.childNodes[0].textContent = '01 ';
    title.lastChild!.textContent = audioDemo ? ' BIG BUCK BUNNY — AUDIO DEMO' : ' BIG BUCK BUNNY — DEVELOPMENT PREVIEW';
  }
  const credit = document.querySelector<HTMLAnchorElement>('#film-credit');
  if (credit) {
    credit.href = 'https://peach.blender.org/about/';
    credit.textContent = 'FILM: BIG BUCK BUNNY · BLENDER FOUNDATION · CC BY 3.0';
  }
  const demoLink = document.querySelector<HTMLAnchorElement>('#audio-demo-link');
  if (audioDemo && demoLink) {
    demoLink.href = './showcase.html';
    demoLink.textContent = 'RETURN TO ANKH MUX SHOWCASE';
    demoLink.removeAttribute('aria-label');
  }
}

const mount = document.querySelector<HTMLElement>('#player-mount');
if (mount) mount.append(createPlayer());
