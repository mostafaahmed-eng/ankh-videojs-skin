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
    if (width === 390) await page.screenshot({ path: 'artifacts/mobile.png', fullPage: true });
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await loadShowcase(page);
  await page.screenshot({ path: 'artifacts/desktop.png', fullPage: true });
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
  await page.screenshot({ path: 'artifacts/playing.png', fullPage: true });

  await page.locator('.ankh-play-button').click();
  await expect.poll(() => video.evaluate((el: HTMLVideoElement) => el.paused)).toBe(true);
  await page.screenshot({ path: 'artifacts/paused.png', fullPage: true });

  const slider = page.locator('.ankh-timeline');
  const bounds = await slider.boundingBox();
  if (!bounds) throw new Error('Solar Timeline has no rendered box');
  await page.mouse.click(bounds.x + bounds.width * 0.65, bounds.y + bounds.height / 2);
  await expect.poll(async () => video.evaluate((el: HTMLVideoElement) => el.currentTime / el.duration)).toBeGreaterThan(0.55);

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
  await page.screenshot({ path: 'artifacts/keyboard-focus.png', fullPage: true });
  await page.keyboard.press('Space');
  await expect.poll(() => video.evaluate((el: HTMLVideoElement) => !el.paused)).toBe(true);

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
    await fullscreen.click();
    await expect.poll(() => page.evaluate(() => Boolean(document.fullscreenElement))).toBe(false);
  }
});
