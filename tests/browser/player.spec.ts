import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFile } from 'node:fs/promises';

const videoSelector = '.ankh-player > mux-video, .ankh-player > hlsjs-video, .ankh-player > video';
const muxPlaybackId = 'QlDrE00kgqfngiVLY01qa011sGYQFV1ftW7VARb4QSCZZA';
let browserErrors: string[] = [];

test.beforeEach(async ({ page }) => {
  browserErrors = [];
  page.on('pageerror', (error) => browserErrors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') browserErrors.push(message.text());
  });
});

test.afterEach(() => {
  expect(browserErrors, 'unexpected browser console or page errors').toEqual([]);
});

async function loadShowcase(
  page: import('@playwright/test').Page,
  options: { fallbackForUnsupportedHls?: boolean } = {},
): Promise<void> {
  await page.goto('/showcase.html');
  await page.locator(videoSelector).waitFor();
  const muxUnsupported = await page.evaluate(() => {
    const video = document.createElement('video');
    return typeof MediaSource === 'undefined' && !video.canPlayType('application/vnd.apple.mpegurl');
  });
  if (muxUnsupported && options.fallbackForUnsupportedHls !== false) {
    await page.locator('.ankh-player > mux-video').evaluate((element) => {
      const media = element as HTMLElement & {
        source: { src: string; type: 'video/mp4' };
      };
      media.source = {
        src: 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/1080/Big_Buck_Bunny_1080_10s_1MB.mp4',
        type: 'video/mp4',
      };
    });
  }
  await page.waitForFunction(
    (selector) => {
      const video = document.querySelector<HTMLVideoElement>(selector);
      return Boolean(video && ((video.readyState >= 1 && Number.isFinite(video.duration)) || video.error));
    },
    videoSelector,
    { timeout: 60_000 },
  );
}

async function capture(page: import('@playwright/test').Page, path: string, fullPage = true): Promise<void> {
  if (test.info().project.name === 'chromium') await page.screenshot({ path, fullPage });
}

test('shows the working showcase without horizontal overflow at target widths', async ({ page }) => {
  await loadShowcase(page);
  await expect(page.locator('#film-credit')).toHaveText('FILM: GREAT PYRAMIDS OF GIZA · K / PEXELS');
  await expect(page.locator('#film-credit')).toHaveAttribute('href', 'https://www.pexels.com/video/stunning-view-of-the-great-pyramids-in-giza-32537704/');
  for (const width of [320, 375, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: width < 500 ? 820 : 900 });
    await loadShowcase(page);
    const dimensions = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      page: document.documentElement.scrollWidth,
      player: document.querySelector('.ankh-player')?.getBoundingClientRect().width ?? 0,
      controls: [...document.querySelectorAll<HTMLElement>('.ankh-button, .ankh-play-button')]
        .filter((element) => getComputedStyle(element).display !== 'none' && element.getAttribute('hidden') === null)
        .map((element) => ({ width: element.getBoundingClientRect().width, height: element.getBoundingClientRect().height })),
    }));
    expect(dimensions.page, `horizontal overflow at ${width}px`).toBeLessThanOrEqual(dimensions.viewport);
    expect(dimensions.player).toBeGreaterThan(0);
    expect(dimensions.controls.every(({ width, height }) => width >= 44 && height >= 44), `undersized touch control at ${width}px`).toBe(true);
    if (width === 390) await capture(page, 'artifacts/final-mobile.png');
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await loadShowcase(page);
  for (const link of [page.locator('#film-credit'), page.locator('#audio-demo-link')]) {
    const bounds = await link.boundingBox();
    expect(bounds?.height, 'showcase links should remain touch friendly on mobile').toBeGreaterThanOrEqual(44);
  }
  await page.setViewportSize({ width: 1440, height: 900 });
  await loadShowcase(page);
  const viewportHeight = await page.evaluate(() => window.innerHeight);
  for (const control of [page.locator('.ankh-timeline'), page.locator('.ankh-play-button')]) {
    const bounds = await control.boundingBox();
    expect(bounds, 'main control should be rendered').not.toBeNull();
    expect(bounds!.y + bounds!.height, 'main control should be above the initial desktop fold').toBeLessThanOrEqual(viewportHeight);
  }
  await capture(page, 'artifacts/final-desktop.png', false);
  await page.locator('.ankh-player').screenshot({ path: 'artifacts/submission-hero.png' });
});

test('production root and showcase routes show ANKH while workbench stays available by name', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/ANKH — The Art of Time/);
  await expect(page.locator('.ankh-player')).toBeVisible();
  await expect(page.locator('#root')).toHaveCount(0);
  await page.goto('/showcase.html');
  await expect(page.locator('.ankh-player')).toBeVisible();
  const workbench = await page.request.get('/workbench.html');
  expect(workbench.ok()).toBe(true);
  const workbenchHtml = await workbench.text();
  expect(workbenchHtml).toContain('<title>ankh - Video.js</title>');
  expect(workbenchHtml).toContain('assets/workbench-');
  expect(workbenchHtml).toContain('id="root"');
  const vercel = JSON.parse(await readFile(new URL('../../vercel.json', import.meta.url), 'utf8')) as { rewrites: Array<{ source: string; destination: string }> };
  expect(vercel.rewrites).toContainEqual({ source: '/workbench', destination: '/workbench.html' });
});

test('surface clicks, skip settings, persisted preferences, shortcuts, boundaries, and screenshots', async ({ page }) => {
  await loadShowcase(page);
  const video = page.locator(videoSelector);
  const bounds = await video.boundingBox();
  if (!bounds) throw new Error('Video has no rendered bounds');
  const surface = { x: bounds.x + bounds.width * 0.18, y: bounds.y + bounds.height * 0.2 };
  await page.mouse.click(surface.x, surface.y);
  await expect.poll(() => video.evaluate((el: HTMLVideoElement) => !el.paused)).toBe(true);
  await capture(page, 'artifacts/v31-playing.png');
  await page.mouse.click(surface.x, surface.y);
  await expect.poll(() => video.evaluate((el: HTMLVideoElement) => el.paused)).toBe(true);

  const beforeControl = await video.evaluate((el: HTMLVideoElement) => el.paused);
  await page.locator('.ankh-mute-button').click();
  expect(await video.evaluate((el: HTMLVideoElement) => el.paused)).toBe(beforeControl);
  await video.evaluate((el: HTMLVideoElement) => { el.currentTime = 8; });
  await page.locator('.ankh-skip-back').click();
  await expect.poll(() => video.evaluate((el: HTMLVideoElement) => el.currentTime)).toBeLessThan(1);
  await page.locator('.ankh-settings summary').click();
  await expect(page.locator('.ankh-settings-panel')).toBeVisible();
  await expect(page.locator('.ankh-back-duration')).toHaveAccessibleName('Skip backward duration');
  await capture(page, 'artifacts/v31-settings.png');
  await page.locator('.ankh-back-duration').selectOption('15');
  await page.locator('.ankh-forward-duration').selectOption('30');
  await expect(page.locator('.ankh-skip-back')).toHaveAccessibleName('Skip backward 15 seconds');
  await expect(page.locator('.ankh-skip-forward')).toHaveAccessibleName('Skip forward 30 seconds');
  await page.reload();
  await expect(page.locator('.ankh-skip-back')).toHaveAccessibleName('Skip backward 15 seconds');
  await expect(page.locator('.ankh-skip-forward')).toHaveAccessibleName('Skip forward 30 seconds');
  await loadShowcase(page);
  const reloadedVideo = page.locator(videoSelector);
  await reloadedVideo.evaluate((el: HTMLVideoElement) => { el.currentTime = 2; });
  await page.locator('.ankh-skip-back').click();
  await expect.poll(() => reloadedVideo.evaluate((el: HTMLVideoElement) => el.currentTime)).toBe(0);
  await reloadedVideo.evaluate((el: HTMLVideoElement) => { el.currentTime = 1; });
  await page.locator('.ankh-skip-forward').click();
  await expect.poll(() => reloadedVideo.evaluate((el: HTMLVideoElement) => el.currentTime)).toBeGreaterThan(20);
  await page.locator('.ankh-settings summary').click();
  await page.locator('.ankh-settings-reset').click();
  await page.locator('.ankh-settings summary').click();
  await expect(page.locator('.ankh-skip-back')).toHaveAccessibleName('Skip backward 10 seconds');
  await expect(page.locator('.ankh-skip-forward')).toHaveAccessibleName('Skip forward 10 seconds');
  await page.mouse.click(surface.x, surface.y);
  await expect.poll(() => reloadedVideo.evaluate((el: HTMLVideoElement) => !el.paused)).toBe(true);
  await capture(page, 'artifacts/v31-desktop.png', false);
  await page.locator('.ankh-player').screenshot({ path: 'artifacts/v31-submission-hero.png' });
  await page.setViewportSize({ width: 390, height: 844 });
  await loadShowcase(page);
  await capture(page, 'artifacts/v31-mobile.png');
});

test('player keyboard shortcuts and double-tap seeking use the active player', async ({ page, browser }) => {
  await loadShowcase(page);
  const video = page.locator(videoSelector);
  await video.evaluate((el: HTMLVideoElement) => { el.currentTime = 8; });
  await page.locator('.ankh-player').focus();
  await page.keyboard.press('j');
  await expect.poll(() => video.evaluate((el: HTMLVideoElement) => el.currentTime)).toBeLessThan(1);
  await page.keyboard.press('l');
  await expect.poll(() => video.evaluate((el: HTMLVideoElement) => el.currentTime)).toBeGreaterThan(8);
  await page.keyboard.press('k');
  await expect.poll(() => video.evaluate((el: HTMLVideoElement) => !el.paused)).toBe(true);
  await page.keyboard.press('k');
  await expect.poll(() => video.evaluate((el: HTMLVideoElement) => el.paused)).toBe(true);

  if (test.info().project.name === 'chromium') {
    const doubleBounds = await video.boundingBox();
    if (doubleBounds) {
      await page.mouse.dblclick(doubleBounds.x + doubleBounds.width * 0.2, doubleBounds.y + doubleBounds.height * 0.2);
      await expect.poll(() => page.evaluate(() => Boolean(document.fullscreenElement))).toBe(true);
      await capture(page, 'artifacts/v31-fullscreen.png', false);
      await page.keyboard.press('Escape');
    }
  }

  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
  const touchPage = await context.newPage();
  try {
    await loadShowcase(touchPage);
    const touchVideo = touchPage.locator(videoSelector);
    await touchVideo.evaluate((el: HTMLVideoElement) => { el.currentTime = 8; });
    const touchBounds = await touchVideo.boundingBox();
    if (!touchBounds) throw new Error('Touch video has no rendered bounds');
    await touchPage.touchscreen.tap(touchBounds.x + touchBounds.width * 0.2, touchBounds.y + touchBounds.height * 0.3);
    await touchPage.waitForTimeout(70);
    await touchPage.touchscreen.tap(touchBounds.x + touchBounds.width * 0.2, touchBounds.y + touchBounds.height * 0.3);
    await expect.poll(() => touchVideo.evaluate((el: HTMLVideoElement) => el.currentTime)).toBeLessThan(1);
    await expect(touchPage.locator('.ankh-seek-feedback')).toContainText('8 seconds');
  } finally {
    await context.close();
  }
});

test('production media uses the public Mux asset and verifies stream metadata or supported error handling', async ({ page }) => {
  const manifestResponses: Array<{ status: number; url: string }> = [];
  page.on('response', (response) => {
    if (response.url().includes(muxPlaybackId) && response.url().includes('.m3u8')) {
      manifestResponses.push({ status: response.status(), url: response.url() });
    }
  });
  await loadShowcase(page, { fallbackForUnsupportedHls: false });
  const mux = page.locator('.ankh-player mux-video');
  await expect(mux).toHaveCount(1);
  const media = await mux.evaluate((element) => {
    const player = element as HTMLElement & {
      source: { playbackId?: string; maxAutoResolution?: string } | null;
      currentTime: number;
      duration: number;
      videoWidth: number;
      videoHeight: number;
      readyState: number;
    };
    return {
      playbackId: player.source?.playbackId,
      maxAutoResolution: player.source?.maxAutoResolution,
      duration: player.duration,
      width: player.videoWidth,
      height: player.videoHeight,
      readyState: player.readyState,
      currentTime: player.currentTime,
    };
  });
  expect(media.playbackId).toBe(muxPlaybackId);
  expect(media.maxAutoResolution).toBe('2160p');
  const muxUnsupported = await page.evaluate(() => {
    const video = document.createElement('video');
    return typeof MediaSource === 'undefined' && !video.canPlayType('application/vnd.apple.mpegurl');
  });
  await expect.poll(() => manifestResponses.some(({ status }) => status === 200)).toBe(true);
  expect(manifestResponses.some(({ status }) => status >= 400)).toBe(false);
  await expect(page.locator('.ankh-player > video')).toHaveCount(0);
  await expect(page.locator('.ankh-poster img')).toHaveAttribute('src', '/ankh-solar-poster.svg');
  await expect(page.locator('.player-caption')).toContainText('ANKH — A JOURNEY THROUGH TIME');
  if (muxUnsupported) {
    await expect.poll(() => mux.evaluate((element) => Boolean((element as HTMLMediaElement).error))).toBe(true);
    await expect(page.locator('.ankh-error-dialog')).toHaveAttribute('data-open', '');
    return;
  }
  expect(media.readyState).toBeGreaterThanOrEqual(1);
  expect(media.duration).toBeGreaterThan(19);
  expect(media.duration).toBeLessThan(23);
  expect(media.width).toBeGreaterThan(0);
  expect(media.height).toBeGreaterThan(0);
  expect(Math.abs(media.width / media.height - 16 / 9)).toBeLessThan(0.03);
});

test('secondary Big Buck Bunny HLS demo exposes an AAC audio rendition for mute and volume checks', async ({ page }) => {
  const playlists: number[] = [];
  page.on('response', (response) => {
    if (response.url().includes('test-streams.mux.dev/x36xhzz') && response.url().includes('.m3u8')) {
      playlists.push(response.status());
    }
  });
  await page.goto('/showcase.html?demo=audio');
  const media = page.locator('.ankh-player > hlsjs-video');
  await media.waitFor();
  await page.waitForFunction(() => {
    const element = document.querySelector<HTMLElement>('.ankh-player > hlsjs-video') as (HTMLElement & { readyState: number; error: MediaError | null }) | null;
    return Boolean(element && (element.readyState >= 1 || element.error));
  }, null, { timeout: 60_000 });
  await expect(page.locator('#film-credit')).toHaveText('FILM: BIG BUCK BUNNY · BLENDER FOUNDATION · CC BY 3.0');
  await expect(page.locator('#audio-demo-link')).toHaveText('RETURN TO ANKH MUX SHOWCASE');
  expect(playlists.some((status) => status === 200 || status === 206)).toBe(true);
  expect(playlists.every((status) => status < 400)).toBe(true);

  const unsupported = await page.evaluate(() => {
    const video = document.createElement('video');
    return typeof MediaSource === 'undefined' && !video.canPlayType('application/vnd.apple.mpegurl');
  });
  if (unsupported) {
    await expect.poll(() => media.evaluate((element) => Boolean((element as HTMLMediaElement).error))).toBe(true);
    await expect(page.locator('.ankh-error-dialog')).toHaveAttribute('data-open', '');
    return;
  }

  await page.locator('.ankh-play-button').click();
  await expect.poll(() => media.evaluate((element) => (element as HTMLMediaElement).currentTime)).toBeGreaterThan(1);
  const codecs = await media.evaluate((element) => {
    const player = element as HTMLElement & { engine?: { levels?: Array<{ audioCodec?: string }> } };
    return player.engine?.levels?.map((level) => level.audioCodec).filter(Boolean) ?? [];
  });
  expect(codecs.some((codec) => codec?.startsWith('mp4a.'))).toBe(true);
  await page.locator('.ankh-player').hover();
  const volumeThumb = page.locator('.ankh-volume-thumb');
  await expect(volumeThumb).toBeVisible();
  const initialVolume = await media.evaluate((element) => (element as HTMLMediaElement).volume);
  await volumeThumb.focus();
  await page.keyboard.press('ArrowLeft');
  await expect.poll(() => media.evaluate((element) => (element as HTMLMediaElement).volume)).toBeLessThan(initialVolume);
  const mutedBefore = await media.evaluate((element) => (element as HTMLMediaElement).muted);
  await expect(page.locator('.ankh-mute-button')).toBeVisible();
  await page.locator('.ankh-mute-button').click();
  await expect.poll(() => media.evaluate((element) => (element as HTMLMediaElement).muted)).toBe(!mutedBefore);
});

test('solar disc is the centered, keyboard-operable initial play control', async ({ page }) => {
  await loadShowcase(page);
  const video = page.locator(videoSelector);
  const solarPlay = page.locator('.ankh-center-play');
  await expect(solarPlay).toBeVisible();
  await expect(solarPlay).toHaveAccessibleName(/play/i);
  const videoBounds = await video.boundingBox();
  const buttonBounds = await solarPlay.boundingBox();
  expect(videoBounds).not.toBeNull();
  expect(buttonBounds).not.toBeNull();
  const center = {
    x: (buttonBounds!.x + buttonBounds!.width / 2 - videoBounds!.x) / videoBounds!.width,
    y: (buttonBounds!.y + buttonBounds!.height / 2 - videoBounds!.y) / videoBounds!.height,
  };
  expect(center.x).toBeGreaterThan(0.6);
  expect(center.x).toBeLessThan(0.68);
  await solarPlay.focus();
  await expect.poll(() => solarPlay.evaluate((el) => getComputedStyle(el).outlineStyle)).not.toBe('none');
  await page.keyboard.press('Enter');
  await expect.poll(() => video.evaluate((el: HTMLVideoElement) => !el.paused)).toBe(true);
});

test('timeline landmarks, pointer preview, and accessible keyboard seeking stay tied to media time', async ({ page }) => {
  await loadShowcase(page);
  const video = page.locator(videoSelector);
  const slider = page.locator('.ankh-timeline');
  await expect(slider.locator('.ankh-landmark-dawn')).toContainText('DAWN 0%');
  await expect(slider.locator('.ankh-landmark-zenith')).toContainText('ZENITH 50%');
  await expect(slider.locator('.ankh-landmark-dusk')).toContainText('DUSK 100%');
  const bounds = await slider.boundingBox();
  expect(bounds).not.toBeNull();
  await page.mouse.move(bounds!.x + bounds!.width * 0.5, bounds!.y + 24);
  await expect.poll(() => slider.locator('.ankh-preview-time').textContent()).not.toBe('');
  await expect.poll(() => slider.locator('.ankh-preview').evaluate((el) => Number(getComputedStyle(el).opacity))).toBeGreaterThan(0);
  const thumb = slider.locator('.ankh-sun-thumb');
  await expect(thumb).toHaveAttribute('role', 'slider');
  await expect(thumb).toHaveAttribute('aria-valuenow', /\d/);
  await thumb.focus();
  const before = await video.evaluate((el: HTMLVideoElement) => el.currentTime);
  await page.keyboard.press('ArrowRight');
  await expect.poll(() => video.evaluate((el: HTMLVideoElement) => el.currentTime)).toBeGreaterThan(before);
});

test('small-container shelf follows the video while preserving the solar arc and touch targets', async ({ page }) => {
  for (const width of [320, 375, 390]) {
    await page.setViewportSize({ width, height: 844 });
    await loadShowcase(page);
    const layout = await page.evaluate(() => {
      const video = document.querySelector('.ankh-player > mux-video, .ankh-player > video')!.getBoundingClientRect();
      const controls = document.querySelector('.ankh-controls')!.getBoundingClientRect();
      const slider = document.querySelector('.ankh-timeline')!.getBoundingClientRect();
      const button = document.querySelector('.ankh-play-button')!.getBoundingClientRect();
      return { videoBottom: video.bottom, controlsTop: controls.top, sliderWidth: slider.width, buttonHeight: button.height };
    });
    expect(layout.controlsTop).toBeGreaterThanOrEqual(layout.videoBottom - 1);
    expect(layout.sliderWidth).toBeGreaterThan(0);
    expect(layout.buttonHeight).toBeGreaterThanOrEqual(44);
    if (width === 390) await capture(page, 'artifacts/final-mobile.png');
  }
});

test('axe accessibility audit covers player controls and timeline', async ({ page }) => {
  await loadShowcase(page);
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  expect(results.violations.map(({ id, impact, nodes }) => ({ id, impact, count: nodes.length }))).toEqual([]);
});

test('plays, pauses, seeks, and toggles mute using Video.js controls', async ({ page }) => {
  await loadShowcase(page);
  const video = page.locator(videoSelector);
  await page.locator('.ankh-play-button').click();
  await expect.poll(() => video.evaluate((el: HTMLVideoElement) => !el.paused)).toBe(true);
  await expect.poll(() => video.evaluate((el: HTMLVideoElement) => el.currentTime)).toBeGreaterThan(8);
  const playBounds = await page.locator('.ankh-play-button').boundingBox();
  if (!playBounds) throw new Error('Play button has no rendered box');
  await page.mouse.move(playBounds.x + playBounds.width / 2, playBounds.y + playBounds.height / 2);
  await expect(page.locator('.ankh-play-button')).toBeVisible();
  await capture(page, 'artifacts/final-playing.png');

  await page.locator('.ankh-play-button').click();
  await expect.poll(() => video.evaluate((el: HTMLVideoElement) => el.paused)).toBe(true);
  await capture(page, 'artifacts/final-paused.png');

  const slider = page.locator('.ankh-timeline');
  const thumb = page.locator('.ankh-sun-thumb');
  await expect(thumb).toHaveAttribute('role', 'slider');
  await expect(thumb).toHaveAttribute('aria-label', /seek/i);
  await expect(thumb).toHaveAttribute('aria-valuenow', /\d/);
  const bounds = await slider.boundingBox();
  if (!bounds) throw new Error('Solar Timeline has no rendered box');
  await thumb.focus();
  await page.keyboard.press('Home');
  await expect.poll(async () => video.evaluate((el: HTMLVideoElement) => el.currentTime / el.duration)).toBeLessThan(0.05);
  const startBounds = await thumb.boundingBox();
  const firstSeekRatio = 0.65;
  const firstSeekY = bounds.y + 10 + 38 * (2 * firstSeekRatio - 1) ** 2;
  await page.mouse.click(bounds.x + bounds.width * firstSeekRatio, firstSeekY);
  await expect.poll(async () => video.evaluate((el: HTMLVideoElement) => el.currentTime / el.duration)).toBeGreaterThan(0.55);

  const scrubRatio = await video.evaluate((el: HTMLVideoElement) => el.currentTime / el.duration);
  const thumbBounds = await thumb.boundingBox();
  expect(thumbBounds).not.toBeNull();
  const thumbRatio = (thumbBounds!.x + thumbBounds!.width / 2 - bounds.x) / bounds.width;
  expect(Math.abs(thumbRatio - scrubRatio), 'solar disc should track real playback position along the arc').toBeLessThan(0.12);
  const arcBounds = await thumb.boundingBox();
  expect(startBounds).not.toBeNull();
  expect(arcBounds).not.toBeNull();
  expect(arcBounds!.y).toBeLessThan(startBounds!.y);

  await page.mouse.move(bounds.x + bounds.width * 0.8, bounds.y + bounds.height / 2);
  await expect.poll(() => page.locator('.ankh-preview').evaluate((el) => Number(getComputedStyle(el).opacity))).toBeGreaterThan(0);
  await capture(page, 'artifacts/final-seeking.png');
  const dragStart = await thumb.boundingBox();
  if (!dragStart) throw new Error('Solar disc has no rendered box');
  const targetRatio = 0.35;
  const targetX = bounds.x + bounds.width * targetRatio;
  const targetY = bounds.y + 10 + 38 * (2 * targetRatio - 1) ** 2;
  await page.mouse.move(dragStart.x + dragStart.width / 2, dragStart.y + dragStart.height / 2, { steps: 4 });
  await page.mouse.down();
  await page.mouse.move(targetX, targetY, { steps: 12 });
  await expect(slider).toHaveAttribute('data-dragging', '');
  await page.mouse.up();
  await expect.poll(async () => video.evaluate((el: HTMLVideoElement) => el.currentTime / el.duration)).toBeGreaterThan(0.25);
  await expect.poll(async () => video.evaluate((el: HTMLVideoElement) => el.currentTime / el.duration)).toBeLessThan(0.45);

  const beforeMute = await video.evaluate((el: HTMLVideoElement) => el.muted);
  await page.locator('.ankh-mute-button').click();
  await expect.poll(() => video.evaluate((el: HTMLVideoElement) => el.muted)).toBe(!beforeMute);

  const rate = page.locator('.ankh-rate');
  const initialRate = await rate.getAttribute('data-rate');
  await rate.click();
  await expect.poll(() => rate.getAttribute('data-rate')).not.toBe(initialRate);
  await expect(page.locator('.ankh-captions-button')).toBeHidden();

  const beforeKeyboardSeek = await video.evaluate((el: HTMLVideoElement) => el.currentTime);
  const seekThumb = page.locator('.ankh-sun-thumb');
  await expect(seekThumb).toHaveAttribute('role', 'slider');
  await seekThumb.focus();
  await page.keyboard.press('ArrowRight');
  await expect.poll(() => video.evaluate((el: HTMLVideoElement) => el.currentTime)).toBeGreaterThan(beforeKeyboardSeek);
});

test('supports keyboard focus, reduced motion, volume, and available fullscreen', async ({ page }) => {
  await loadShowcase(page);
  const video = page.locator(videoSelector);
  const play = page.locator('.ankh-play-button');
  await play.focus();
  const focus = await play.evaluate((el) => getComputedStyle(el).outlineStyle);
  expect(focus).not.toBe('none');
  const tooltipId = await play.getAttribute('commandfor');
  expect(tooltipId).toBeTruthy();
  await expect(page.locator(`#${tooltipId}`)).toBeVisible();
  await capture(page, 'artifacts/final-keyboard-focus.png');
  await page.keyboard.press('Space');
  await expect.poll(() => video.evaluate((el: HTMLVideoElement) => !el.paused)).toBe(true);
  await expect(page.locator(`#${tooltipId} media-tooltip-label`)).toContainText(/pause/i);

  await page.emulateMedia({ reducedMotion: 'reduce' });
  const transition = await page.locator('.ankh-controls-content').evaluate((el) => getComputedStyle(el).transitionDuration);
  expect(transition.split(',').every((duration) => duration.trim() === '0s')).toBe(true);
  const loaderAnimation = await page.locator('.solar-loader').evaluate((el) => getComputedStyle(el).animationName);
  expect(loaderAnimation).toBe('none');

  const volumeSlider = page.locator('.ankh-volume-thumb');
  await expect(volumeSlider).toBeVisible();
  const volumeBefore = await video.evaluate((el: HTMLVideoElement) => el.volume);
  await volumeSlider.focus();
  await page.keyboard.press('ArrowLeft');
  await expect.poll(() => video.evaluate((el: HTMLVideoElement) => el.volume)).toBeLessThan(volumeBefore);

  const fullscreen = page.locator('.ankh-fullscreen-button');
  if (await fullscreen.isVisible()) {
    await fullscreen.click();
    await expect.poll(() => page.evaluate(() => Boolean(document.fullscreenElement))).toBe(true);
    await capture(page, 'artifacts/final-fullscreen.png', false);
    await page.keyboard.press('Escape');
    await expect.poll(() => page.evaluate(() => Boolean(document.fullscreenElement))).toBe(false);
  }
});

test('seeks accurately with touch input on a narrow player', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  try {
    await loadShowcase(page);
    const slider = page.locator('.ankh-timeline');
    const bounds = await slider.boundingBox();
    if (!bounds) throw new Error('Solar Timeline has no rendered box');
    await page.touchscreen.tap(bounds.x + bounds.width * 0.75, bounds.y + bounds.height / 2);
    const video = page.locator(videoSelector);
    await expect.poll(() => video.evaluate((el: HTMLVideoElement) => el.currentTime / el.duration)).toBeGreaterThan(0.65);
    await expect(slider.locator('.ankh-sun-thumb')).toHaveAttribute('role', 'slider');
    expect(errors).toEqual([]);
  } finally {
    await context.close();
  }
});

test('renders chapter sections when the media supplies real chapter cues', async ({ page }) => {
  await loadShowcase(page);
  await page.locator(videoSelector).evaluate((element) => {
    const video = element as HTMLVideoElement;
    const chapters = video.addTextTrack('chapters', 'Solar passages', 'en');
    chapters.addCue(new VTTCue(0, 3, 'Dawn'));
    chapters.addCue(new VTTCue(3, 7, 'Zenith'));
    chapters.addCue(new VTTCue(7, 10, 'Dusk'));
    chapters.mode = 'showing';
  });
  await expect.poll(() => page.locator('.ankh-chapter').count()).toBeGreaterThan(1);
  await expect(page.locator('.ankh-preview-chapter')).toHaveCount(1);
});
