import '@videojs/html/ui/container';
import '@videojs/html/ui/controls';
import '@videojs/html/ui/controls-backdrop';
import '@videojs/html/ui/controls-content';
import '@videojs/html/ui/controls-group';
import '@videojs/html/ui/play-button';
import '@videojs/html/ui/time-slider';
import '@videojs/html/ui/time-slider-chapters';
import '@videojs/html/ui/time-slider-chapter-title';
import '@videojs/html/ui/slider-track';
import '@videojs/html/ui/slider-buffer';
import '@videojs/html/ui/slider-fill';
import '@videojs/html/ui/slider-thumb';
import '@videojs/html/ui/slider-preview';
import '@videojs/html/ui/slider-value';
import '@videojs/html/ui/time';
import '@videojs/html/ui/time-group';
import '@videojs/html/ui/time-separator';
import '@videojs/html/ui/mute-button';
import '@videojs/html/ui/volume-slider';
import '@videojs/html/ui/fullscreen-button';
import '@videojs/html/ui/pip-button';
import '@videojs/html/ui/playback-rate-button';
import '@videojs/html/ui/captions-button';
import '@videojs/html/ui/buffering-indicator';
import '@videojs/html/ui/status-announcer';
import '@videojs/html/ui/error-dialog';
import '@videojs/html/ui/dialog-backdrop';
import '@videojs/html/ui/dialog-popup';
import '@videojs/html/ui/dialog-title';
import '@videojs/html/ui/dialog-description';
import '@videojs/html/ui/dialog-close';
import '@videojs/html/ui/hotkey';
import '@videojs/html/ui/gesture';
import '@videojs/html/ui/tooltip';
import '@videojs/html/ui/tooltip-group';
import '@videojs/html/ui/tooltip-label';
import './skin.css';

const watchedSliders = new WeakSet<Element>();
const tooledPlayers = new WeakSet<Element>();
let playerSequence = 0;

function bindPlayerTooltips(player: Element): void {
  if (tooledPlayers.has(player)) return;
  tooledPlayers.add(player);
  const scope = `ankh-${++playerSequence}`;
  player.querySelectorAll<HTMLElement>('[data-ankh-tooltip]').forEach((trigger) => {
    const key = trigger.dataset.ankhTooltip;
    if (!key) return;
    const tooltip = player.querySelector<HTMLElement>(`[data-ankh-tooltip-target="${key}"]`);
    if (!tooltip) return;
    const id = `${scope}-${key}-tooltip`;
    tooltip.id = id;
    trigger.setAttribute('commandfor', id);
  });
}

function positionSolarDisc(slider: HTMLElement): void {
  const thumb = slider.querySelector<HTMLElement>('.ankh-sun-thumb');
  if (!thumb) return;

  const styles = getComputedStyle(slider);
  const property = slider.hasAttribute('data-dragging') ? '--media-slider-pointer' : '--media-slider-fill';
  const rawProgress = Number.parseFloat(styles.getPropertyValue(property));
  const progress = Number.isFinite(rawProgress) ? Math.min(100, Math.max(0, rawProgress)) / 100 : 0;
  const width = slider.getBoundingClientRect().width;
  const x = width * (0.014 + 0.972 * progress);
  const y = 10 + 38 * (2 * progress - 1) ** 2;

  thumb.style.left = `${x}px`;
  thumb.style.top = `${y}px`;
}

function watchSolarSlider(slider: Element): void {
  if (watchedSliders.has(slider) || !(slider instanceof HTMLElement)) return;
  const thumb = slider.querySelector('.ankh-sun-thumb');
  if (!thumb) return;
  watchedSliders.add(slider);
  const player = slider.closest('video-player');
  if (player) bindPlayerTooltips(player);

  const update = () => positionSolarDisc(slider);
  const stateObserver = new MutationObserver(update);
  stateObserver.observe(slider, { attributes: true, attributeFilter: ['class', 'style'] });
  const sizeObserver = new ResizeObserver(update);
  sizeObserver.observe(slider);
  for (const eventName of ['pointerdown', 'pointermove', 'pointerup']) {
    slider.addEventListener(eventName, update, { passive: true });
  }
  const media = slider.closest('video-player')?.querySelector('video');
  for (const eventName of ['timeupdate', 'seeked', 'durationchange', 'loadedmetadata']) media?.addEventListener(eventName, update);
  if (media && navigator.vendor.includes('Apple')) {
    let fallbackProgress: number | undefined;
    const seekAtPointer = (event: PointerEvent) => {
      if (!slider.hasAttribute('data-dragging') || event.pointerType !== 'mouse') return;
      const bounds = slider.getBoundingClientRect();
      if (bounds.width <= 0 || !Number.isFinite(media.duration)) return;
      fallbackProgress = Math.min(1, Math.max(0, (event.clientX - bounds.left) / bounds.width));
      media.currentTime = fallbackProgress * media.duration;
    };
    document.addEventListener('pointermove', seekAtPointer, { capture: true, passive: true });
    document.addEventListener('pointerup', () => {
      const progress = fallbackProgress;
      fallbackProgress = undefined;
      if (progress !== undefined) requestAnimationFrame(() => { media.currentTime = progress * media.duration; });
    }, true);
    document.addEventListener('pointercancel', () => { fallbackProgress = undefined; }, true);
  }
  update();
}

function findSolarSliders(root: ParentNode): void {
  if (root instanceof Element && root.matches('.ankh-timeline')) watchSolarSlider(root);
  root.querySelectorAll('.ankh-timeline').forEach(watchSolarSlider);
}

findSolarSliders(document);
new MutationObserver((records) => {
  for (const record of records) {
    record.addedNodes.forEach((node) => {
      if (node instanceof Element) findSolarSliders(node);
    });
  }
}).observe(document.documentElement, { childList: true, subtree: true });
