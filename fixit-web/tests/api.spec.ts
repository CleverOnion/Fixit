// tests/api.spec.ts
// API Integration Tests

import { test, expect } from './fixtures/app';

test.describe('API - Questions', () => {
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
  });

  test('should fetch questions list successfully', async ({ page }) => {
    const questions = [
      { id: 'q1', content: 'Test question 1', subject: '数学', masteryLevel: 2, createdAt: new Date().toISOString() },
      { id: 'q2', content: 'Test question 2', subject: '语文', masteryLevel: 4, createdAt: new Date().toISOString() },
    ];

    await page.route('**/api/questions**', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({ data: questions, total: 2 }),
      });
    });

    await page.goto('/questions');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('text=Test question 1')).toBeVisible();
    await expect(page.locator('text=Test question 2')).toBeVisible();
  });

  test('should handle empty questions list', async ({ page }) => {
    await page.route('**/api/questions**', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({ data: [], total: 0 }),
      });
    });

    await page.goto('/questions');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('text=还没有录入题目')).toBeVisible();
  });

  test('should filter questions by subject', async ({ page }) => {
    await page.route('**/api/questions**', async (route) => {
      const url = route.request().url();
      if (url.includes('subject=数学')) {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            data: [{ id: 'q1', content: '数学题目', subject: '数学', masteryLevel: 1, createdAt: new Date().toISOString() }],
            total: 1,
          }),
        });
      } else {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({ data: [], total: 0 }),
        });
      }
    });

    await page.goto('/questions');
    await page.waitForLoadState('networkidle');

    // Click math filter
    await page.click('text=数学');
    await page.waitForTimeout(500);

    await expect(page.locator('text=数学题目')).toBeVisible();
  });

  test('should search questions', async ({ page }) => {
    await page.route('**/api/questions**', async (route) => {
      const url = route.request().url();
      if (url.includes('search=关键字')) {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            data: [{ id: 'q1', content: '包含关键字的题目', subject: '数学', masteryLevel: 1, createdAt: new Date().toISOString() }],
            total: 1,
          }),
        });
      } else {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({ data: [], total: 0 }),
        });
      }
    });

    await page.goto('/questions');
    await page.waitForLoadState('networkidle');

    // Search for content
    await page.fill('.searchInput', '关键字');
    await page.waitForTimeout(600);

    await expect(page.locator('text=包含关键字的题目')).toBeVisible();
  });
});

test.describe('API - Review', () => {
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
  });

  test('should fetch pending review questions', async ({ page }) => {
    await page.route('**/api/review/pending**', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          data: [
            { id: 'q1', content: 'Review question 1', answer: 'Answer 1', subject: '数学', masteryLevel: 1 },
          ],
        }),
      });
    });

    await page.goto('/practice');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('.questionContent')).toContainText('Review question 1');
  });

  test('should submit review status', async ({ page }) => {
    let submitCalled = false;

    await page.route('**/api/review/pending**', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          data: [{ id: 'q1', content: 'Test', answer: 'A', subject: '数学', masteryLevel: 1 }],
        }),
      });
    });

    await page.route('**/api/review/submit', async (route) => {
      submitCalled = true;
      const postData = await route.request().postDataJSON();
      expect(postData.questionId).toBe('q1');
      expect(['FORGOTTEN', 'FUZZY', 'MASTERED']).toContain(postData.status);
      await route.fulfill({ status: 200, body: JSON.stringify({}) });
    });

    await page.goto('/practice');
    await page.waitForLoadState('networkidle');

    // Show answer and submit review
    await page.click('.showAnswerBtn');
    await page.click('text=完全掌握');

    await expect(page).toPass(() => expect(submitCalled).toBe(true));
  });

  test('should fetch review stats', async ({ page }) => {
    await page.route('**/api/review/stats**', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          totalQuestions: 100,
          dueToday: 5,
          thisWeekReviews: 20,
          masteryDistribution: [
            { level: 0, count: 10 },
            { level: 1, count: 20 },
            { level: 2, count: 30 },
            { level: 3, count: 25 },
            { level: 4, count: 10 },
            { level: 5, count: 5 },
          ],
        }),
      });
    });

    await page.goto('/stats');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('text=100')).toBeVisible(); // Total questions
  });

  test('should fetch streak data', async ({ page }) => {
    await page.route('**/api/review/streak**', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          currentStreak: 7,
          longestStreak: 14,
          totalDays: 30,
          lastReviewDate: new Date().toISOString(),
        }),
      });
    });

    await page.goto('/stats');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('.streakBadge')).toContainText('7');
  });
});

test.describe('API - Tags and Subjects', () => {
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
  });

  test('should fetch tags list', async ({ page }) => {
    await page.route('**/api/tags**', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify([
          { id: 't1', name: '概念理解', category: '知识类型', color: '#6366F1' },
          { id: 't2', name: '计算错误', category: '错误类型', color: '#EF4444' },
          { id: 't3', name: '审题失误', category: '错误类型', color: '#F59E0B' },
        ]),
      });
    });

    await page.goto('/import');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('text=概念理解')).toBeVisible();
    await expect(page.locator('text=计算错误')).toBeVisible();
    await expect(page.locator('text=审题失误')).toBeVisible();
  });

  test('should fetch subjects list', async ({ page }) => {
    await page.route('**/api/subjects**', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify(['数学', '语文', '英语', '物理', '化学']),
      });
    });

    await page.goto('/questions');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('text=数学')).toBeVisible();
    await expect(page.locator('text=语文')).toBeVisible();
  });
});

test.describe('API - Error Handling', () => {
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
  });

  test('should handle 401 unauthorized', async ({ page }) => {
    await page.route('**/api/**', async (route) => {
      await route.fulfill({
        status: 401,
        body: JSON.stringify({ message: '未登录或登录已过期' }),
      });
    });

    await page.goto('/questions');
    await page.waitForLoadState('networkidle');

    // Should redirect to login
    await page.waitForURL('**/login');
  });

  test('should handle 403 forbidden', async ({ page }) => {
    await page.route('**/api/**', async (route) => {
      await route.fulfill({
        status: 403,
        body: JSON.stringify({ message: '没有权限访问此资源' }),
      });
    });

    await page.goto('/questions');
    await page.waitForLoadState('networkidle');

    // Should show error message
    await expect(page.locator('.ant-message-error')).toContainText('没有权限');
  });

  test('should handle 404 not found', async ({ page }) => {
    await page.route('**/api/**', async (route) => {
      await route.fulfill({
        status: 404,
        body: JSON.stringify({ message: '请求的资源不存在' }),
      });
    });

    await page.goto('/questions');
    await page.waitForLoadState('networkidle');

    // Should show error message
    await expect(page.locator('.ant-message-error')).toContainText('不存在');
  });

  test('should handle 500 server error', async ({ page }) => {
    await page.route('**/api/**', async (route) => {
      await route.fulfill({
        status: 500,
        body: JSON.stringify({ message: '服务器错误，请稍后重试' }),
      });
    });

    await page.goto('/questions');
    await page.waitForLoadState('networkidle');

    // Should show error message
    await expect(page.locator('.ant-message-error')).toContainText('服务器错误');
  });

  test('should handle network errors', async ({ page }) => {
    await page.route('**/api/**', async (route) => {
      // Simulate network error
      await route.abort('failed');
    });

    await page.goto('/questions');

    // Should show error message
    await expect(page.locator('.ant-message-error')).toBeVisible();
  });

  test('should show loading state during API calls', async ({ page }) => {
    // Slow response
    await page.route('**/api/questions**', async (route) => {
      await page.waitForTimeout(2000);
      await route.fulfill({
        status: 200,
        body: JSON.stringify({ data: [], total: 0 }),
      });
    });

    await page.goto('/questions');

    // Should show loading skeleton
    await expect(page.locator('.ant-skeleton')).toBeVisible();
  });
});

test.describe('API - Performance', () => {
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
  });

  test('should load page within acceptable time', async ({ page }) => {
    const startTime = Date.now();

    await page.route('**/api/**', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({ data: [], total: 0 }),
      });
    });

    await page.goto('/questions');
    await page.waitForLoadState('networkidle');

    const loadTime = Date.now() - startTime;

    // Page should load within 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });

  test('should handle rapid navigation', async ({ page }) => {
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

    // Mock all pages
    await page.route('**/api/**', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({ data: [], total: 0 }),
      });
    });

    await page.goto('/');
    await page.waitForURL('**/');

    // Rapidly navigate between pages
    await page.click('text=题库');
    await page.waitForURL('**/questions');

    await page.click('text=练习');
    await page.waitForURL('**/practice');

    await page.click('text=统计');
    await page.waitForURL('**/stats');

    await page.click('text=录入');
    await page.waitForURL('**/import');

    // Should complete without errors
    await expect(page.locator('.pageTitle')).toBeVisible();
  });
});
