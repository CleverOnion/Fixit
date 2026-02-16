// tests/app.spec.ts
// Basic Application Test - Smoke Test

import { test, expect } from './fixtures/app';

test.describe('Application Smoke Test', () => {
  test('should load login page without errors', async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Check page loaded correctly
    await expect(page).toHaveTitle(/Fixit/);
  });

  test('should render login form elements', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Check form elements
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should navigate to register page', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Click register link
    await page.click('text=立即注册');
    await page.waitForURL('**/register');

    // Check register page loaded
    await expect(page.locator('h1')).toContainText('创建账号');
  });
});
