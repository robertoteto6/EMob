import { test, expect } from '@playwright/test';

test('home page should hit network', async ({ page }) => {
  const responses: string[] = [];

  page.on('response', (response) => {
    const url = response.url();
    if (url.includes('/api/') || url.includes('/_next/data')) {
      responses.push(`${response.status()} ${url}`);
    }
  });

  await page.goto('/', { waitUntil: 'load' });
  await page.waitForTimeout(2000);

  console.log('Responses captured:', responses);
  expect.soft(responses.length).toBeGreaterThan(0);
});
