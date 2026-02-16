// tests/navigation.spec.ts
// Navigation and Layout E2E Tests - TopNav + QuickActions

import { test, expect } from './fixtures/app';

test.describe('TopNav Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Set auth state
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

    // Mock API calls
    await page.route('**/api/questions**', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({ data: [], total: 0 }),
      });
    });

    await page.route('**/api/review/**', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({ data: [], count: 0 }),
      });
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should display TopNav header on authenticated pages', async ({ page }) => {
    await expect(page.locator('.nav')).toBeVisible();
  });

  test('should show Fixit logo in TopNav', async ({ page }) => {
    await expect(page.locator('.logo')).toContainText('Fixit');
  });

  test('should display all navigation links in TopNav', async ({ page }) => {
    await expect(page.locator('.navLinks')).toBeVisible();
    await expect(page.locator('.navLink').filter({ hasText: '首页' })).toBeVisible();
    await expect(page.locator('.navLink').filter({ hasText: '题库' })).toBeVisible();
    await expect(page.locator('.navLink').filter({ hasText: '练习' })).toBeVisible();
    await expect(page.locator('.navLink').filter({ hasText: '统计' })).toBeVisible();
    await expect(page.locator('.navLink').filter({ hasText: '录入' })).toBeVisible();
  });

  test('should navigate to Home when clicking Home link', async ({ page }) => {
    await page.click('.navLink:has-text("首页")');
    await page.waitForURL('**/');
  });

  test('should navigate to Questions when clicking Questions link', async ({ page }) => {
    await page.click('.navLink:has-text("题库")');
    await page.waitForURL('**/questions');
  });

  test('should navigate to Practice when clicking Practice link', async ({ page }) => {
    await page.click('.navLink:has-text("练习")');
    await page.waitForURL('**/practice');
  });

  test('should navigate to Stats when clicking Stats link', async ({ page }) => {
    await page.click('.navLink:has-text("统计")');
    await page.waitForURL('**/stats');
  });

  test('should navigate to Import when clicking Import link', async ({ page }) => {
    await page.click('.navLink:has-text("录入")');
    await page.waitForURL('**/import');
  });

  test('should highlight current page in navigation', async ({ page }) => {
    // Navigate to questions
    await page.click('.navLink:has-text("题库")');
    await page.waitForURL('**/questions');

    // Questions nav link should be active
    const questionsNavLink = page.locator('.navLink').filter({ hasText: '题库' });
    await expect(questionsNavLink).toHaveClass(/navLinkActive/);
  });
});

test.describe('TopNav Header', () => {
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

  test('should display user avatar in header', async ({ page }) => {
    await expect(page.locator('.userMenu')).toBeVisible();
    await expect(page.locator('.ant-avatar')).toBeVisible();
  });

  test('should display search button', async ({ page }) => {
    await expect(page.locator('.searchBtn')).toBeVisible();
    await expect(page.locator('.searchText')).toContainText('搜索');
  });

  test('should open search modal when clicking search button', async ({ page }) => {
    await page.click('.searchBtn');
    await expect(page.locator('.searchModal')).toBeVisible();
  });

  test('should display keyboard shortcut for search', async ({ page }) => {
    await expect(page.locator('.searchKbd')).toContainText('⌘K');
  });

  test('should open user dropdown when clicking avatar', async ({ page }) => {
    await page.click('.userMenu');
    await expect(page.locator('.ant-dropdown')).toBeVisible();
  });

  test('should have logout in user dropdown', async ({ page }) => {
    await page.click('.userMenu');
    await expect(page.locator('text=退出登录')).toBeVisible();
  });
});

test.describe('QuickActions', () => {
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

  test('should display QuickActions floating button', async ({ page }) => {
    await expect(page.locator('.mainBtn')).toBeVisible();
  });

  test('should expand QuickActions when clicking main button', async ({ page }) => {
    await page.click('.mainBtn');
    await expect(page.locator('.actions')).toBeVisible();
  });

  test('should display Import action when expanded', async ({ page }) => {
    await page.click('.mainBtn');
    await expect(page.locator('.action').filter({ hasText: '录入题目' })).toBeVisible();
  });

  test('should display Practice action when expanded', async ({ page }) => {
    await page.click('.mainBtn');
    await expect(page.locator('.action').filter({ hasText: '开始练习' })).toBeVisible();
  });

  test('should navigate to Import when clicking Import action', async ({ page }) => {
    await page.click('.mainBtn');
    await page.click('.action:has-text("录入题目")');
    await page.waitForURL('**/import');
  });

  test('should navigate to Practice when clicking Practice action', async ({ page }) => {
    await page.click('.mainBtn');
    await page.click('.action:has-text("开始练习")');
    await page.waitForURL('**/practice');
  });

  test('should close QuickActions when clicking main button again', async ({ page }) => {
    await page.click('.mainBtn');
    await expect(page.locator('.expanded')).toBeVisible();
    await page.click('.mainBtn');
    await expect(page.locator('.expanded')).not.toBeVisible();
  });
});

test.describe('Page Navigation Flow', () => {
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

    // Mock all API calls
    await page.route('**/api/**', async (route) => {
      const url = route.request().url();
      if (url.includes('/questions')) {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({ data: [], total: 0 }),
        });
      } else if (url.includes('/review')) {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({ data: [], count: 0 }),
        });
      } else if (url.includes('/stats')) {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            totalQuestions: 0,
            dueToday: 0,
            thisWeekReviews: 0,
            masteryDistribution: [],
          }),
        });
      } else {
        await route.fulfill({ status: 200, body: JSON.stringify({}) });
      }
    });
  });

  test('should navigate from Home to Import page via QuickActions', async ({ page }) => {
    await page.goto('/');
    await page.waitForURL('**/');

    await page.click('.mainBtn');
    await page.click('.action:has-text("录入题目")');
    await page.waitForURL('**/import');
  });

  test('should navigate from Home to Practice page via QuickActions', async ({ page }) => {
    await page.goto('/');
    await page.waitForURL('**/');

    await page.click('.mainBtn');
    await page.click('.action:has-text("开始练习")');
    await page.waitForURL('**/practice');
  });

  test('should navigate back to Home from any page via TopNav', async ({ page }) => {
    await page.goto('/stats');
    await page.waitForURL('**/stats');

    await page.click('.navLink:has-text("首页")');
    await page.waitForURL('**/');
  });

  test('should navigate through all pages via TopNav', async ({ page }) => {
    await page.goto('/');
    await page.waitForURL('**/');

    // Test each navigation
    await page.click('.navLink:has-text("题库")');
    await page.waitForURL('**/questions');

    await page.click('.navLink:has-text("练习")');
    await page.waitForURL('**/practice');

    await page.click('.navLink:has-text("统计")');
    await page.waitForURL('**/stats');

    await page.click('.navLink:has-text("录入")');
    await page.waitForURL('**/import');

    await page.click('.navLink:has-text("首页")');
    await page.waitForURL('**/');
  });
});
