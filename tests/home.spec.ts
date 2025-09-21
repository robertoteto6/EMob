import { test, expect } from '@playwright/test';

test('home page should hit network', async ({ page }) => {
  const responses: string[] = [];

  page.on('response', (response) => {
    const url = response.url();
    if (url.includes('/api/') || url.includes('/_next/data')) {
      responses.push(`${response.status()} ${url}`);
    }
  });

  const networkPromise = page.waitForResponse((response) => {
    const url = response.url();
    return url.includes('/api/esports/matches') || url.includes('/api/esports/tournaments');
  }, { timeout: 20000 });

  await page.goto('/', { waitUntil: 'load' });
  await networkPromise;
  await page.waitForTimeout(500);

  expect.soft(responses.length).toBeGreaterThan(0);
});
