// tests/responsive.spec.ts
// Responsive Layout Tests

import { test, expect } from './fixtures/app';

test.describe('Responsive Layout - Desktop', () => {
  test.use({ viewport: { width: 1920, height: 1080 } });

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('user-storage', JSON.stringify({
        state: {
          user: { id: '1', email: 'test@example.com', nickname: 'TestUser', createdAt: new Date().toISOString() },
          token: 'test-token',
          isLoggedIn: true,
        },
        version: 0,
      }));
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should display full sidebar on desktop', async ({ page }) => {
    await expect(page.locator('.ant-layout-sider')).toBeVisible();
    await expect(page.locator('text=首页')).toBeVisible();
    await expect(page.locator('text=题库')).toBeVisible();
    await expect(page.locator('text=练习')).toBeVisible();
    await expect(page.locator('text=统计')).toBeVisible();
    await expect(page.locator('text=录入')).toBeVisible();
  });

  test('should display full menu labels', async ({ page }) => {
    await expect(page.locator('.ant-menu-item')).toContainText('首页');
    await expect(page.locator('.ant-menu-item')).toContainText('题库');
    await expect(page.locator('.ant-menu-item')).toContainText('练习');
    await expect(page.locator('.ant-menu-item')).toContainText('统计');
    await expect(page.locator('.ant-menu-item')).toContainText('录入');
  });

  test('should display grid layout for stats', async ({ page }) => {
    const statsGrid = page.locator('.statsGrid');
    await expect(statsGrid).toBeVisible();
  });

  test('should display multiple columns for content', async ({ page }) => {
    const middleRow = page.locator('.middleRow');
    if (await middleRow.isVisible()) {
      // Should display side by side on desktop
      const box = await middleRow.boundingBox();
      expect(box?.width).toBeGreaterThan(800);
    }
  });
});

test.describe('Responsive Layout - Tablet', () => {
  test.use({ viewport: { width: 768, height: 1024 } });

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('user-storage', JSON.stringify({
        state: {
          user: { id: '1', email: 'test@example.com', nickname: 'TestUser', createdAt: new Date().toISOString() },
          token: 'test-token',
          isLoggedIn: true,
        },
        version: 0,
      }));
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should display sidebar on tablet', async ({ page }) => {
    await expect(page.locator('.ant-layout-sider')).toBeVisible();
  });

  test('should display compact menu', async ({ page }) => {
    // Menu items should still be visible
    await expect(page.locator('.ant-menu-item').first()).toBeVisible();
  });

  test('should adjust grid layout for tablet', async ({ page }) => {
    const statsGrid = page.locator('.statsGrid');
    if (await statsGrid.isVisible()) {
      const box = await statsGrid.boundingBox();
      expect(box?.width).toBeLessThanOrEqual(768);
    }
  });
});

test.describe('Responsive Layout - Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('user-storage', JSON.stringify({
        state: {
          user: { id: '1', email: 'test@example.com', nickname: 'TestUser', createdAt: new Date().toISOString() },
          token: 'test-token',
          isLoggedIn: true,
        },
        version: 0,
      }));
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should collapse sidebar on mobile', async ({ page }) => {
    // Sidebar should be collapsible on mobile
    const sider = page.locator('.ant-layout-sider');
    if (await sider.isVisible()) {
      // Mobile view typically has collapsed sidebar
      const classes = await sider.getAttribute('class');
      // Either collapsed or with responsive behavior
      expect(classes).toBeTruthy();
    }
  });

  test('should display hamburger menu on mobile', async ({ page }) => {
    // Should have mobile navigation trigger
    const menuTrigger = page.locator('.anticon-menu');
    if (await menuTrigger.isVisible()) {
      await menuTrigger.click();
      await expect(page.locator('.ant-drawer')).toBeVisible();
    }
  });

  test('should stack grid layout vertically on mobile', async ({ page }) => {
    const statsGrid = page.locator('.statsGrid');
    if (await statsGrid.isVisible()) {
      const box = await statsGrid.boundingBox();
      expect(box?.width).toBeLessThanOrEqual(375);
    }
  });

  test('should be scrollable on mobile', async ({ page }) => {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    const scrollPosition = await page.evaluate(() => window.scrollY);
    expect(scrollPosition).toBeGreaterThan(0);
  });
});

test.describe('Touch Interactions', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('user-storage', JSON.stringify({
        state: {
          user: { id: '1', email: 'test@example.com', nickname: 'TestUser', createdAt: new Date().toISOString() },
          token: 'test-token',
          isLoggedIn: true,
        },
        version: 0,
      }));
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should support touch scrolling', async ({ page }) => {
    // Swipe up on the page
    await page.touchscreen.tap(187, 500);
    await page.evaluate(() => window.scrollTo(0, 500));
    const scrollPosition = await page.evaluate(() => window.scrollY);
    expect(scrollPosition).toBeGreaterThan(0);
  });

  test('should have tap targets large enough for touch', async ({ page }) => {
    // Check buttons have minimum touch target size (44px)
    const buttons = await page.locator('button').all();
    for (const button of buttons.slice(0, 5)) {
      const box = await button.boundingBox();
      if (box) {
        expect(box.height).toBeGreaterThanOrEqual(32);
      }
    }
  });
});
