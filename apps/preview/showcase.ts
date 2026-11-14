import './showcase.css';
import { createPlayer } from './src/frame/player';

const mount = document.querySelector<HTMLElement>('#player-mount');
if (mount) mount.append(createPlayer());
