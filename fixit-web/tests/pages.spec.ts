// tests/pages.spec.ts
// All Pages E2E Tests - Home, Questions, Import, Practice, Stats

import { test, expect } from './fixtures/app';

test.describe('Home Page', () => {
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
    await page.route('**/reviews/today-count', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({ count: 5 }),
      });
    });

    await page.route('**/reviews/pending**', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          data: [
            {
              id: 'q1',
              content: '这是一道测试题目',
              subject: '数学',
              masteryLevel: 2,
              createdAt: new Date().toISOString(),
            },
          ],
        }),
      });
    });

    await page.route('**/reviews/streak', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          currentStreak: 7,
          longestStreak: 14,
          totalDays: 30,
        }),
      });
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should display welcome greeting', async ({ page }) => {
    await expect(page.locator('.heroTitle')).toContainText('TestUser');
  });

  test('should display today review count', async ({ page }) => {
    await expect(page.locator('.heroSubtitle')).toContainText('5');
  });

  test('should display quick action cards', async ({ page }) => {
    await expect(page.locator('text=录入题目')).toBeVisible();
    await expect(page.locator('text=开始复习')).toBeVisible();
    await expect(page.locator('text=数据统计')).toBeVisible();
    await expect(page.locator('text=我的题目')).toBeVisible();
  });

  test('should display stats cards', async ({ page }) => {
    await expect(page.locator('text=总题目数')).toBeVisible();
    await expect(page.locator('text=今日待复习')).toBeVisible();
    await expect(page.locator('text=掌握率')).toBeVisible();
    await expect(page.locator('text=连续学习')).toBeVisible();
  });

  test('should display streak badge when active', async ({ page }) => {
    await expect(page.locator('.streakBadge')).toContainText('7 天连续');
  });

  test('should show "立即复习" button when have questions to review', async ({ page }) => {
    const reviewBtn = page.locator('text=立即复习');
    await expect(reviewBtn).toBeVisible();
  });

  test('should display mastery ring chart', async ({ page }) => {
    await expect(page.locator('.ringSvg')).toBeVisible();
  });

  test('should display recent questions section', async ({ page }) => {
    await expect(page.locator('text=最近录入')).toBeVisible();
    await expect(page.locator('text=这是一道测试题目')).toBeVisible();
  });

  test('should navigate to import page when clicking action card', async ({ page }) => {
    await page.click('text=录入题目 >> nth=0');
    await page.waitForURL('**/import');
  });
});

test.describe('Questions Page', () => {
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

    // Mock API calls
    await page.route('**/api/questions**', async (route) => {
      const url = route.request().url();
      if (url.includes('/subjects')) {
        await route.fulfill({
          status: 200,
          body: JSON.stringify(['数学', '语文', '英语']),
        });
      } else if (url.includes('/questions?')) {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            data: [
              {
                id: 'q1',
                content: '这是第一道题目',
                subject: '数学',
                masteryLevel: 2,
                createdAt: new Date().toISOString(),
                tags: [],
              },
              {
                id: 'q2',
                content: '这是第二道题目',
                subject: '语文',
                masteryLevel: 4,
                createdAt: new Date().toISOString(),
                tags: [],
              },
            ],
            total: 2,
          }),
        });
      } else {
        await route.fulfill({ status: 200, body: JSON.stringify({ data: [] }) });
      }
    });

    await page.goto('/questions');
    await page.waitForLoadState('networkidle');
  });

  test('should display page title', async ({ page }) => {
    await expect(page.locator('.pageTitle')).toContainText('题库');
  });

  test('should display subject filter chips', async ({ page }) => {
    await expect(page.locator('text=数学').first()).toBeVisible();
    await expect(page.locator('text=语文').first()).toBeVisible();
    await expect(page.locator('text=英语').first()).toBeVisible();
  });

  test('should display search input', async ({ page }) => {
    await expect(page.locator('.searchInput')).toBeVisible();
  });

  test('should display questions table', async ({ page }) => {
    await expect(page.locator('.tableWrapper')).toBeVisible();
    await expect(page.locator('text=这是第一道题目')).toBeVisible();
    await expect(page.locator('text=这是第二道题目')).toBeVisible();
  });

  test('should display subject badges for each question', async ({ page }) => {
    await expect(page.locator('.subjectBadge').first()).toContainText('数学');
  });

  test('should display mastery level for each question', async ({ page }) => {
    await expect(page.locator('.masteryBadge').first()).toContainText('熟悉');
  });

  test('should display edit and delete buttons', async ({ page }) => {
    await expect(page.locator('[title="编辑"]').first()).toBeVisible();
    await expect(page.locator('[title="删除"]').first()).toBeVisible();
  });

  test('should navigate to edit page when clicking edit button', async ({ page }) => {
    await page.click('[title="编辑"] >> nth=0');
    await page.waitForURL('**/questions/q1');
  });

  test('should filter by subject when clicking subject chip', async ({ page }) => {
    await page.click('text=数学 >> nth=0');
    // Subject chip should be active
    await expect(page.locator('.subjectChipActive').first()).toContainText('数学');
  });

  test('should search questions', async ({ page }) => {
    await page.fill('.searchInput', '第一道');
    // Wait for debounce
    await page.waitForTimeout(500);
    await expect(page.locator('text=这是第一道题目')).toBeVisible();
  });

  test('should navigate to import page when clicking add button', async ({ page }) => {
    await page.click('.addButton');
    await page.waitForURL('**/import');
  });

  test('should show empty state when no questions', async ({ page }) => {
    // Override mock for empty data
    await page.route('**/api/questions**', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({ data: [], total: 0 }),
      });
    });

    await page.reload();
    await page.waitForLoadState('networkidle');

    await expect(page.locator('text=还没有录入题目')).toBeVisible();
  });
});

test.describe('Import Page', () => {
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

    // Mock API calls
    await page.route('**/api/tags**', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify([
          { id: 'tag1', name: '概念理解', category: '知识类型', color: '#6366F1' },
          { id: 'tag2', name: '计算错误', category: '错误类型', color: '#EF4444' },
        ]),
      });
    });

    await page.route('**/api/subjects**', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify(['数学', '语文', '英语']),
      });
    });

    await page.goto('/import');
    await page.waitForLoadState('networkidle');
  });

  test('should display page title', async ({ page }) => {
    await expect(page.locator('.headerTitle')).toContainText('录入新题目');
  });

  test('should display subject selector', async ({ page }) => {
    await expect(page.locator('.subjectSelector')).toBeVisible();
    await expect(page.locator('.subjectPill').first()).toContainText('数学');
  });

  test('should select subject when clicking pill', async ({ page }) => {
    await page.click('.subjectPill:has-text("数学")');
    await expect(page.locator('.subjectPill:has-text("数学")')).toHaveClass(/selected/);
  });

  test('should display image upload zone', async ({ page }) => {
    await expect(page.locator('.uploadZone')).toBeVisible();
    await expect(page.locator('text=点击或拖拽图片到这里')).toBeVisible();
  });

  test('should display markdown editor toolbar', async ({ page }) => {
    await expect(page.locator('.editorToolbar')).toBeVisible();
    await expect(page.locator('.toolbarBtn').first()).toBeVisible();
  });

  test('should display content textarea', async ({ page }) => {
    await expect(page.locator('.editorTextarea').first()).toBeVisible();
  });

  test('should display answer textarea', async ({ page }) => {
    await expect(page.locator('.editorTextarea').nth(1)).toBeVisible();
  });

  test('should display analysis textarea', async ({ page }) => {
    await expect(page.locator('.editorTextarea').nth(2)).toBeVisible();
  });

  test('should display tag selector', async ({ page }) => {
    await expect(page.locator('.tagList')).toBeVisible();
    await expect(page.locator('text=概念理解')).toBeVisible();
    await expect(page.locator('text=计算错误')).toBeVisible();
  });

  test('should display preview panel', async ({ page }) => {
    await expect(page.locator('.previewPanel')).toBeVisible();
    await expect(page.locator('text=Preview')).toBeVisible();
  });

  test('should enable submit button when required fields filled', async ({ page }) => {
    // Fill subject
    await page.click('.subjectPill:has-text("数学")');

    // Fill content
    await page.fill('.editorTextarea >> nth=0', '这是一道测试题目');

    // Fill answer
    await page.fill('.editorTextarea >> nth=1', '答案是 A');

    // Submit button should be enabled
    await expect(page.locator('.submitBtn').first()).toBeEnabled();
  });

  test('should navigate back to questions on cancel', async ({ page }) => {
    await page.click('.cancelBtn');
    await page.waitForURL('**/questions');
  });

  test('should select and deselect tags', async ({ page }) => {
    await page.click('.tag:has-text("概念理解")');
    await expect(page.locator('.tag:has-text("概念理解")')).toHaveClass(/selected/);

    await page.click('.tag:has-text("概念理解")');
    await expect(page.locator('.tag:has-text("概念理解")')).not.toHaveClass(/selected/);
  });
});

test.describe('Practice Page', () => {
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

    // Mock API calls
    await page.route('**/reviews/pending**', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          data: [
            {
              id: 'q1',
              content: '这是一道复习题目\n\n$1 + 2 = ?$',
              answer: '$$3$$',
              subject: '数学',
              masteryLevel: 1,
              analysis: '这是解析内容',
              tags: [],
            },
          ],
        }),
      });
    });

    await page.route('**/api/subjects**', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify(['数学', '语文']),
      });
    });

    await page.goto('/practice');
    await page.waitForLoadState('networkidle');
  });

  test('should display progress indicator', async ({ page }) => {
    await expect(page.locator('.progressIndicator')).toContainText('1 / 1');
  });

  test('should display filter button', async ({ page }) => {
    await expect(page.locator('.filterBtn')).toBeVisible();
  });

  test('should display question content', async ({ page }) => {
    await expect(page.locator('.questionContent')).toContainText('这是一道复习题目');
  });

  test('should display subject badge', async ({ page }) => {
    await expect(page.locator('.tagSubject')).toContainText('数学');
  });

  test('should hide answer by default', async ({ page }) => {
    await expect(page.locator('.answerHidden')).toBeVisible();
    await expect(page.locator('text=按空格键或点击查看答案')).toBeVisible();
  });

  test('should show answer when clicking show button', async ({ page }) => {
    await page.click('.showAnswerBtn');
    await expect(page.locator('.answerVisible')).toBeVisible();
  });

  test('should display analysis after showing answer', async ({ page }) => {
    await page.click('.showAnswerBtn');
    await expect(page.locator('.analysisSection')).toContainText('解析');
  });

  test('should display review buttons after showing answer', async ({ page }) => {
    await page.click('.showAnswerBtn');
    await expect(page.locator('.reviewPrompt')).toContainText('这道题掌握程度如何');
    await expect(page.locator('text=没做对')).toBeVisible();
    await expect(page.locator('text=有点模糊')).toBeVisible();
    await expect(page.locator('text=完全掌握')).toBeVisible();
  });

  test('should display keyboard shortcuts', async ({ page }) => {
    await page.click('.showAnswerBtn');
    await expect(page.locator('.shortcutBarInCard')).toContainText('1');
    await expect(page.locator('.shortcutBarInCard')).toContainText('2');
    await expect(page.locator('.shortcutBarInCard')).toContainText('3');
  });

  test('should navigate back on cancel', async ({ page }) => {
    await page.click('.backBtn');
    await page.waitForURL('**/');
  });

  test('should show completed state after finishing review', async ({ page }) => {
    // Mock successful review submission
    await page.route('**/reviews/submit', async (route) => {
      await route.fulfill({ status: 200, body: JSON.stringify({}) });
    });

    await page.click('.showAnswerBtn');
    await page.click('text=完全掌握');

    await expect(page.locator('text=复习完成')).toBeVisible();
    await expect(page.locator('text=查看统计')).toBeVisible();
  });

  test('should show empty state when no questions to review', async ({ page }) => {
    // Override mock for empty data
    await page.route('**/reviews/pending**', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({ data: [] }),
      });
    });

    await page.reload();
    await page.waitForLoadState('networkidle');

    await expect(page.locator('text=暂无待复习题目')).toBeVisible();
  });
});

test.describe('Stats Page', () => {
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

    // Mock API calls
    await page.route('**/reviews/stats**', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          totalQuestions: 100,
          dueToday: 10,
          thisWeekReviews: 50,
          masteryDistribution: [
            { level: 0, count: 10 },
            { level: 1, count: 15 },
            { level: 2, count: 20 },
            { level: 3, count: 25 },
            { level: 4, count: 20 },
            { level: 5, count: 10 },
          ],
        }),
      });
    });

    await page.route('**/reviews/heatmap**', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify([
          { date: '2024-01-01', count: 5, intensity: 3 },
          { date: '2024-01-02', count: 3, intensity: 2 },
        ]),
      });
    });

    await page.route('**/reviews/streak**', async (route) => {
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

    await page.route('**/reviews/calendar**', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({}),
      });
    });

    await page.goto('/stats');
    await page.waitForLoadState('networkidle');
  });

  test('should display page title', async ({ page }) => {
    await expect(page.locator('.pageTitle')).toContainText('数据统计');
  });

  test('should display data cards', async ({ page }) => {
    await expect(page.locator('text=总题目数')).toBeVisible();
    await expect(page.locator('text=今日待复习')).toBeVisible();
    await expect(page.locator('text=连续学习')).toBeVisible();
    await expect(page.locator('text=掌握率')).toBeVisible();
  });

  test('should display heatmap', async ({ page }) => {
    await expect(page.locator('.heatmapContainer')).toBeVisible();
  });

  test('should display study stats', async ({ page }) => {
    await expect(page.locator('text=学习概览')).toBeVisible();
    await expect(page.locator('text=本周复习')).toBeVisible();
    await expect(page.locator('text=最长连续')).toBeVisible();
  });

  test('should display mastery distribution chart', async ({ page }) => {
    await expect(page.locator('text=掌握程度分布')).toBeVisible();
    await expect(page.locator('.ringChart')).toBeVisible();
  });

  test('should display monthly calendar', async ({ page }) => {
    await expect(page.locator('text=月度复习记录')).toBeVisible();
    await expect(page.locator('.calendarGrid')).toBeVisible();
  });

  test('should display learning tips', async ({ page }) => {
    await expect(page.locator('text=学习建议')).toBeVisible();
    await expect(page.locator('text=艾宾浩斯复习法')).toBeVisible();
  });

  test('should display quick action buttons', async ({ page }) => {
    await expect(page.locator('text=开始复习')).toBeVisible();
    await expect(page.locator('text=管理题目')).toBeVisible();
    await expect(page.locator('text=录入新题')).toBeVisible();
  });

  test('should navigate to practice page from quick action', async ({ page }) => {
    await page.click('.quickActionBtnPrimary');
    await page.waitForURL('**/practice');
  });

  test('should navigate back on cancel', async ({ page }) => {
    await page.click('.backBtn');
    await page.waitForURL('**/');
  });

  test('should navigate through calendar months', async ({ page }) => {
    await page.click('.calendarNavBtn >> nth=0');
    await page.click('.calendarNavBtn >> nth=1');
  });
});
