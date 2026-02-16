// simple.spec.ts - Quick verification test
import { test, expect } from '@playwright/test';

test('simple test', async ({ page }) => {
  await page.goto('http://localhost:5173');
  await expect(page).toHaveTitle(/.*/);
});
