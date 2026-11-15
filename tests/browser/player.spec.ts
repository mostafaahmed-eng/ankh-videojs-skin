import { expect, test } from '@playwright/test';

const videoSelector = '.ankh-player video';
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

async function loadShowcase(page: import('@playwright/test').Page): Promise<void> {
  await page.goto('/showcase.html');
  await page.locator(videoSelector).waitFor();
  await page.waitForFunction(
    (selector) => {
      const video = document.querySelector<HTMLVideoElement>(selector);
      return Boolean(video && (video.readyState >= 1 || video.error) && Number.isFinite(video.duration));
    },
    videoSelector,
    { timeout: 60_000 },
  );
}

async function capture(page: import('@playwright/test').Page, path: string, fullPage = true): Promise<void> {
  if (test.info().project.name === 'chromium') await page.screenshot({ path, fullPage });
}

test('shows the working showcase without horizontal overflow at target widths', async ({ page }) => {
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
    if (width === 390) await capture(page, 'artifacts/v2-mobile.png');
  }
  await page.setViewportSize({ width: 1440, height: 900 });
  await loadShowcase(page);
  const viewportHeight = await page.evaluate(() => window.innerHeight);
  for (const control of [page.locator('.ankh-timeline'), page.locator('.ankh-play-button')]) {
    const bounds = await control.boundingBox();
    expect(bounds, 'main control should be rendered').not.toBeNull();
    expect(bounds!.y + bounds!.height, 'main control should be above the initial desktop fold').toBeLessThanOrEqual(viewportHeight);
  }
  await capture(page, 'artifacts/v2-desktop.png', false);
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
  await capture(page, 'artifacts/v2-playing.png');

  await page.locator('.ankh-play-button').click();
  await expect.poll(() => video.evaluate((el: HTMLVideoElement) => el.paused)).toBe(true);
  await capture(page, 'artifacts/v2-paused.png');

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
  const dragStart = await thumb.boundingBox();
  if (!dragStart) throw new Error('Solar disc has no rendered box');
  const targetRatio = 0.35;
  const targetX = bounds.x + bounds.width * targetRatio;
  const targetY = bounds.y + 10 + 38 * (2 * targetRatio - 1) ** 2;
  await page.mouse.move(dragStart.x + dragStart.width / 2, dragStart.y + dragStart.height / 2, { steps: 4 });
  await page.mouse.down();
  await page.mouse.move(targetX, targetY, { steps: 12 });
  await expect(slider).toHaveAttribute('data-dragging', '');
  await expect.poll(async () => video.evaluate((el: HTMLVideoElement) => el.currentTime / el.duration)).toBeLessThan(0.5);
  await page.mouse.up();
  await expect.poll(async () => video.evaluate((el: HTMLVideoElement) => el.currentTime / el.duration)).toBeGreaterThan(0.2);

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
  await capture(page, 'artifacts/v2-keyboard-focus.png');
  await page.keyboard.press('Space');
  await expect.poll(() => video.evaluate((el: HTMLVideoElement) => !el.paused)).toBe(true);
  await expect(page.locator(`#${tooltipId} media-tooltip-label`)).toContainText(/pause/i);

  await page.emulateMedia({ reducedMotion: 'reduce' });
  const transition = await page.locator('.ankh-controls-content').evaluate((el) => getComputedStyle(el).transitionDuration);
  expect(transition.split(',').every((duration) => duration.trim() === '0s')).toBe(true);

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
    await capture(page, 'artifacts/v2-fullscreen.png', false);
    await fullscreen.click();
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
