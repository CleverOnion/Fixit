// tests/fixtures/app.ts
// Playwright Test Fixtures - Fixit App Test Setup

import { test as base, expect, Page, BrowserContext } from '@playwright/test';

/**
 * Custom test fixtures for Fixit application
 */
export const test = base.extend({
  /**
   * Create authenticated context for logged-in tests
   */
  authenticatedContext: async ({ context }, use) => {
    // Navigate to login page first
    await context.addInitScript(() => {
      // Mock authenticated state
      localStorage.setItem('user-storage', JSON.stringify({
        state: {
          user: {
            id: 'test-user-id',
            email: 'test@example.com',
            nickname: 'TestUser',
            createdAt: new Date().toISOString(),
          },
          token: 'test-jwt-token',
          isLoggedIn: true,
        },
        version: 0,
      }));
    });
    await use(context);
  },

  /**
   * Create page with mocked API responses
   */
  pageWithMockedApi: async ({ page }, use) => {
    // Mock API endpoints
    await page.route('**/api/auth/profile', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          id: 'test-user-id',
          email: 'test@example.com',
          nickname: 'TestUser',
          createdAt: new Date().toISOString(),
        }),
      });
    });

    await page.route('**/api/questions**', async (route) => {
      const url = route.request().url();
      if (url.includes('/questions?')) {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            data: [],
            total: 0,
            page: 1,
            pageSize: 10,
          }),
        });
      } else {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            data: [],
            total: 0,
          }),
        });
      }
    });

    // Handle /api/review/** routes
    await page.route('**/api/review/**', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          data: [],
          total: 0,
          count: 0,
        }),
      });
    });

    // Handle /reviews/** routes
    await page.route('**/reviews/**', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          data: [],
          total: 0,
          count: 0,
        }),
      });
    });

    await page.route('**/api/tags**', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify([
          { id: 'tag-1', name: '概念理解', category: '知识类型', color: '#6366F1' },
          { id: 'tag-2', name: '计算错误', category: '错误类型', color: '#EF4444' },
          { id: 'tag-3', name: '审题失误', category: '错误类型', color: '#F59E0B' },
        ]),
      });
    });

    await page.route('**/api/subjects**', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify(['数学', '语文', '英语', '物理', '化学']),
      });
    });

    await use(page);
  },

  /**
   * Navigate to app and wait for hydration
   */
  appPage: async ({ page }, use) => {
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
    await use(page);
  },
});

/**
 * Common assertions and helpers
 */
export { expect };

/**
 * Test data generators
 */
export const testData = {
  generateUser: () => ({
    email: `test${Date.now()}@example.com`,
    password: 'Test123456',
    nickname: 'TestUser',
  }),

  generateQuestion: () => ({
    subject: '数学',
    content: '这是一道测试题目',
    answer: '答案是 A',
    analysis: '这是解析内容',
  }),
};
