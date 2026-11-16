import '@videojs/html/ui/container';
import '@videojs/html/ui/poster';
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
const escapeBoundPlayers = new WeakSet<Element>();
const interactionBoundPlayers = new WeakSet<HTMLElement>();
const skipChoices = [5, 10, 15, 30, 60] as const;
type SkipDirection = 'back' | 'forward';
type MediaLike = HTMLElement & { currentTime: number; duration: number; paused: boolean; play: () => Promise<void>; pause: () => void; muted: boolean; volume: number };
let activePlayer: HTMLElement | null = null;
let playerSequence = 0;

function installPlayerInteractions(player: HTMLElement): void {
  if (interactionBoundPlayers.has(player)) return;
  const media = player.querySelector<MediaLike>('video, mux-video, hlsjs-video');
  if (!media) return;
  interactionBoundPlayers.add(player);
  player.tabIndex = 0;

  const readPreferences = (): Record<SkipDirection, number> => {
    const defaults = { back: 10, forward: 10 };
    try {
      const raw = localStorage.getItem('ankh-playback-preferences');
      const parsed = raw ? JSON.parse(raw) as Record<string, unknown> : {};
      return {
        back: skipChoices.includes(parsed.back as typeof skipChoices[number]) ? parsed.back as number : defaults.back,
        forward: skipChoices.includes(parsed.forward as typeof skipChoices[number]) ? parsed.forward as number : defaults.forward,
      };
    } catch { return defaults; }
  };
  let preferences = readPreferences();
  const backSelect = player.querySelector<HTMLSelectElement>('.ankh-back-duration');
  const forwardSelect = player.querySelector<HTMLSelectElement>('.ankh-forward-duration');
  const updateSkipUI = () => {
    for (const [direction, selector] of [['back', backSelect], ['forward', forwardSelect]] as const) {
      const seconds = preferences[direction];
      const button = player.querySelector<HTMLButtonElement>(`.ankh-skip-${direction}`);
      if (selector) selector.value = String(seconds);
      if (button) {
        button.setAttribute('aria-label', `Skip ${direction === 'back' ? 'backward' : 'forward'} ${seconds} seconds`);
        button.title = `Skip ${direction === 'back' ? 'backward' : 'forward'} ${seconds} seconds`;
        const value = button.querySelector('span');
        if (value) value.textContent = String(seconds);
      }
    }
  };
  const savePreferences = () => {
    try { localStorage.setItem('ankh-playback-preferences', JSON.stringify(preferences)); } catch { /* Storage may be disabled. */ }
    updateSkipUI();
  };
  updateSkipUI();

  const feedback = document.createElement('div');
  feedback.className = 'ankh-seek-feedback';
  feedback.setAttribute('aria-live', 'polite');
  feedback.setAttribute('aria-atomic', 'true');
  player.append(feedback);
  let feedbackTimer = 0;
  const seek = (delta: number, showFeedback = false) => {
    if (!Number.isFinite(media.duration)) return;
    const start = Number.isFinite(media.currentTime) ? media.currentTime : 0;
    const next = Math.min(media.duration, Math.max(0, start + delta));
    media.currentTime = next;
    if (showFeedback) {
      const skipped = next - start;
      feedback.textContent = `${skipped < 0 ? '−' : '+'}${Math.round(Math.abs(skipped))} seconds`;
      feedback.dataset.visible = '';
      window.clearTimeout(feedbackTimer);
      feedbackTimer = window.setTimeout(() => feedback.removeAttribute('data-visible'), 900);
    }
  };

  for (const direction of ['back', 'forward'] as const) {
    player.querySelector(`.ankh-skip-${direction}`)?.addEventListener('click', (event) => {
      event.stopPropagation();
      seek((direction === 'back' ? -1 : 1) * preferences[direction]);
    });
  }
  for (const [direction, select] of [['back', backSelect], ['forward', forwardSelect]] as const) {
    select?.addEventListener('change', () => {
      const choice = Number(select.value);
      if (skipChoices.includes(choice as typeof skipChoices[number])) {
        preferences = { ...preferences, [direction]: choice };
        savePreferences();
      }
    });
  }
  player.querySelector('.ankh-settings-reset')?.addEventListener('click', () => {
    preferences = { back: 10, forward: 10 };
    savePreferences();
  });

  player.addEventListener('pointerdown', () => { activePlayer = player; }, true);
  player.addEventListener('focusin', () => { activePlayer = player; });
  const isSurfaceTarget = (target: EventTarget | null): boolean => {
    if (!(target instanceof Element) || target.closest('.ankh-controls, button, select, input, [role="slider"], details, a')) return false;
    return target === player || target === media || Boolean(target.closest('.ankh-poster'));
  };
  let clickTimer = 0;
  let lastTap = 0;
  let lastTouchAt = 0;
  let lastTouchX = 0;
  player.addEventListener('click', (event) => {
    if (!isSurfaceTarget(event.target) || performance.now() - lastTouchAt < 700) return;
    window.clearTimeout(clickTimer);
    clickTimer = window.setTimeout(() => { if (media.paused) void media.play(); else media.pause(); }, 260);
  });
  player.addEventListener('dblclick', (event) => {
    if (!isSurfaceTarget(event.target) || performance.now() - lastTouchAt < 700) return;
    window.clearTimeout(clickTimer);
    event.preventDefault();
    const request = player.requestFullscreen?.bind(player);
    if (!document.fullscreenElement) void request?.();
    else void document.exitFullscreen();
  });
  player.addEventListener('pointerup', (event) => {
    if (event.pointerType !== 'touch' || !isSurfaceTarget(event.target)) return;
    const now = performance.now();
    lastTouchAt = now;
    if (now - lastTap < 320) {
      window.clearTimeout(clickTimer);
      seek(event.clientX < player.getBoundingClientRect().left + player.clientWidth / 2 ? -preferences.back : preferences.forward, true);
      lastTap = 0;
    } else {
      lastTap = now;
      lastTouchX = event.clientX;
      window.clearTimeout(clickTimer);
      clickTimer = window.setTimeout(() => {
        if (Math.abs(event.clientX - lastTouchX) < 24) { if (media.paused) void media.play(); else media.pause(); }
      }, 330);
    }
  });

  if (!document.documentElement.hasAttribute('data-ankh-shortcuts')) {
    document.documentElement.setAttribute('data-ankh-shortcuts', '');
    document.addEventListener('keydown', (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement) || target.isContentEditable || target.matches('input, textarea, select, [contenteditable="true"]')) return;
      const owner = target.closest<HTMLElement>('.ankh-player');
      const selectedPlayer = owner ?? activePlayer;
      if (!selectedPlayer || !selectedPlayer.isConnected) return;
      const selectedMedia = selectedPlayer.querySelector<MediaLike>('video, mux-video, hlsjs-video');
      if (!selectedMedia) return;
      const focusedSlider = target.getAttribute('role') === 'slider';
      if (focusedSlider && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
      const prefs = (() => { try { return JSON.parse(localStorage.getItem('ankh-playback-preferences') || '{}') as { back?: number; forward?: number }; } catch { return {}; } })();
      const back = skipChoices.includes(prefs.back as typeof skipChoices[number]) ? prefs.back! : 10;
      const forward = skipChoices.includes(prefs.forward as typeof skipChoices[number]) ? prefs.forward! : 10;
      let handled = true;
      switch (event.key.toLowerCase()) {
        case ' ': case 'k': if (target.matches('button, summary')) { handled = false; break; } if (selectedMedia.paused) void selectedMedia.play(); else selectedMedia.pause(); break;
        case 'j': selectedMedia.currentTime = Math.max(0, selectedMedia.currentTime - back); break;
        case 'l': selectedMedia.currentTime = Math.min(selectedMedia.duration, selectedMedia.currentTime + forward); break;
        case 'arrowleft': selectedMedia.currentTime = Math.max(0, selectedMedia.currentTime - 5); break;
        case 'arrowright': selectedMedia.currentTime = Math.min(selectedMedia.duration, selectedMedia.currentTime + 5); break;
        case 'm': selectedMedia.muted = !selectedMedia.muted; break;
        case 'f': if (!document.fullscreenElement) void selectedPlayer.requestFullscreen?.(); else void document.exitFullscreen(); break;
        case 'arrowup': selectedMedia.volume = Math.min(1, selectedMedia.volume + 0.05); break;
        case 'arrowdown': selectedMedia.volume = Math.max(0, selectedMedia.volume - 0.05); break;
        default: handled = false;
      }
      if (handled) event.preventDefault();
    });
  }
}

function bindPlayerTooltips(player: Element): void {
  if (!escapeBoundPlayers.has(player)) {
    escapeBoundPlayers.add(player);
    player.addEventListener('keydown', (event) => {
      if (!(event instanceof KeyboardEvent) || event.key !== 'Escape' || !document.fullscreenElement) return;
      const fullscreenTarget = document.fullscreenElement;
      if (fullscreenTarget !== player && !player.contains(fullscreenTarget)) return;
      event.preventDefault();
      void document.exitFullscreen();
    }, true);
  }
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
  const media = slider.closest('video-player')?.querySelector('video, mux-video, hlsjs-video') as (Element & { currentTime: number; duration: number }) | null;
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
      if (progress !== undefined) {
        requestAnimationFrame(() => requestAnimationFrame(() => {
          media.currentTime = progress * media.duration;
        }));
      }
    }, true);
    document.addEventListener('pointercancel', () => { fallbackProgress = undefined; }, true);
  }
  update();
}

function findSolarSliders(root: ParentNode): void {
  if (root instanceof HTMLElement && root.matches('.ankh-player')) installPlayerInteractions(root);
  root.querySelectorAll<HTMLElement>('.ankh-player').forEach(installPlayerInteractions);
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
