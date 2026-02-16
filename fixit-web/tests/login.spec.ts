// tests/login.spec.ts
// Login and Register Pages E2E Tests

import { test, expect } from './fixtures/app';

test.describe('Login Page - UI', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
  });

  test('should display login form correctly', async ({ page }) => {
    // Check page title and elements
    await expect(page.locator('h1')).toContainText('欢迎回来');
    await expect(page.locator('.subtitle')).toContainText('继续你的错题管理之旅');
  });

  test('should show logo and branding', async ({ page }) => {
    // Check logo is visible
    await expect(page.locator('.logoSection')).toBeVisible();
    await expect(page.locator('.logoText')).toContainText('Fixit');
  });

  test('should navigate to register page when clicking link', async ({ page }) => {
    await page.click('text=立即注册');
    await page.waitForURL('**/register');
    await expect(page.locator('h1')).toContainText('创建账号');
  });

  test('should validate email format', async ({ page }) => {
    const emailInput = page.locator('input[type="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();

    // Fill invalid email
    await emailInput.fill('invalid-email');
    await passwordInput.fill('password123');

    // Try to submit
    await page.click('button[type="submit"]');

    // Should show validation error
    await expect(page.locator('.ant-form-item-explain-error')).toContainText('邮箱格式不正确');
  });

  test('should validate required fields', async ({ page }) => {
    // Submit empty form
    await page.click('button[type="submit"]');

    // Should show required field errors
    await expect(page.locator('.ant-form-item-explain-error')).toContainText('请输入邮箱');
    await expect(page.locator('.ant-form-item-explain-error')).toContainText('请输入密码');
  });

  test('should focus email input on page load', async ({ page }) => {
    const emailInput = page.locator('input[type="email"]').first();
    await expect(emailInput).toBeFocused();
  });
});

test.describe('Login Page - Authentication Flow', () => {
  test('should redirect to home on successful login', async ({ page }) => {
    // Mock successful login
    await page.route('**/api/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          user: {
            id: '1',
            email: 'test@example.com',
            nickname: 'TestUser',
            createdAt: new Date().toISOString(),
          },
          token: 'mock-jwt-token',
        }),
      });
    });

    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Wait for navigation
    await page.waitForURL('**/');
  });

  test('should show error on invalid credentials', async ({ page }) => {
    // Mock failed login
    await page.route('**/api/auth/login', async (route) => {
      await route.fulfill({
        status: 401,
        body: JSON.stringify({
          message: '邮箱或密码错误',
        }),
      });
    });

    await page.fill('input[type="email"]', 'wrong@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    // Should show error message
    await expect(page.locator('.ant-message-error')).toContainText('邮箱或密码错误');
  });

  test('should show loading state during login', async ({ page }) => {
    // Mock slow login response
    await page.route('**/api/auth/login', async (route) => {
      await page.waitForTimeout(2000);
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          user: {
            id: '1',
            email: 'test@example.com',
            nickname: 'TestUser',
            createdAt: new Date().toISOString(),
          },
          token: 'mock-jwt-token',
        }),
      });
    });

    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Should show loading state
    await expect(page.locator('text=登录中...')).toBeVisible();
  });

  test('should disable submit button while loading', async ({ page }) => {
    await page.route('**/api/auth/login', async (route) => {
      await page.waitForTimeout(2000);
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          user: {
            id: '1',
            email: 'test@example.com',
            nickname: 'TestUser',
            createdAt: new Date().toISOString(),
          },
          token: 'mock-jwt-token',
        }),
      });
    });

    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Button should be disabled
    await expect(page.locator('button[type="submit"]')).toBeDisabled();
  });

  test('should handle Enter key to submit form', async ({ page }) => {
    // Mock successful login
    await page.route('**/api/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          user: {
            id: '1',
            email: 'test@example.com',
            nickname: 'TestUser',
            createdAt: new Date().toISOString(),
          },
          token: 'mock-jwt-token',
        }),
      });
    });

    const emailInput = page.locator('input[type="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();

    await emailInput.fill('test@example.com');
    await passwordInput.fill('password123');
    await passwordInput.press('Enter');

    // Wait for navigation
    await page.waitForURL('**/');
  });
});

test.describe('Register Page - UI', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/register');
    await page.waitForLoadState('networkidle');
  });

  test('should display register form correctly', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('创建账号');
    await expect(page.locator('.subtitle')).toContainText('开始你的错题管理之旅');
  });

  test('should navigate to login page when clicking link', async ({ page }) => {
    await page.click('text=立即登录');
    await page.waitForURL('**/login');
    await expect(page.locator('h1')).toContainText('欢迎回来');
  });

  test('should validate nickname length', async ({ page }) => {
    const nicknameInput = page.locator('input[autocomplete="nickname"]');
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]').first();

    // Fill with short nickname
    await nicknameInput.fill('a');
    await emailInput.fill('test@example.com');
    await passwordInput.fill('password123');
    await page.click('button[type="submit"]');

    // Should show validation error
    await expect(page.locator('.ant-form-item-explain-error')).toContainText('昵称至少2个字符');
  });

  test('should validate password length', async ({ page }) => {
    const nicknameInput = page.locator('input[autocomplete="nickname"]');
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]').first();

    await nicknameInput.fill('testuser');
    await emailInput.fill('test@example.com');
    await passwordInput.fill('12345');
    await page.click('button[type="submit"]');

    // Should show validation error
    await expect(page.locator('.ant-form-item-explain-error')).toContainText('密码至少6个字符');
  });

  test('should validate password confirmation', async ({ page }) => {
    const nicknameInput = page.locator('input[autocomplete="nickname"]');
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]').first();
    const confirmPasswordInput = page.locator('input[autocomplete="new-password"]').last();

    await nicknameInput.fill('testuser');
    await emailInput.fill('test@example.com');
    await passwordInput.fill('password123');
    await confirmPasswordInput.fill('password456');
    await page.click('button[type="submit"]');

    // Should show validation error
    await expect(page.locator('.ant-form-item-explain-error')).toContainText('两次输入的密码不一致');
  });
});

test.describe('Register Page - Authentication Flow', () => {
  test('should redirect to home on successful registration', async ({ page }) => {
    // Mock successful registration
    await page.route('**/api/auth/register', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          user: {
            id: '1',
            email: 'newuser@example.com',
            nickname: 'NewUser',
            createdAt: new Date().toISOString(),
          },
          token: 'mock-jwt-token',
        }),
      });
    });

    await page.goto('/register');
    await page.fill('input[autocomplete="nickname"]', 'NewUser');
    await page.fill('input[type="email"]', 'newuser@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.fill('input[autocomplete="new-password"]', 'password123');
    await page.click('button[type="submit"]');

    // Wait for navigation
    await page.waitForURL('**/');
  });

  test('should show error on duplicate email', async ({ page }) => {
    // Mock failed registration
    await page.route('**/api/auth/register', async (route) => {
      await route.fulfill({
        status: 400,
        body: JSON.stringify({
          message: '该邮箱已被注册',
        }),
      });
    });

    await page.fill('input[autocomplete="nickname"]', 'testuser');
    await page.fill('input[type="email"]', 'existing@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.fill('input[autocomplete="new-password"]', 'password123');
    await page.click('button[type="submit"]');

    // Should show error message
    await expect(page.locator('.ant-message-error')).toContainText('该邮箱已被注册');
  });
});

test.describe('Auth - Protected Routes', () => {
  test('should redirect to login when accessing protected route without auth', async ({ page }) => {
    // Try to access home page without auth
    await page.goto('/');
    await page.waitForURL('**/login');
  });

  test('should redirect to login when accessing questions without auth', async ({ page }) => {
    await page.goto('/questions');
    await page.waitForURL('**/login');
  });

  test('should redirect to home when accessing login while logged in', async ({ page }) => {
    // Set auth state
    await page.addInitScript(() => {
      localStorage.setItem('user-storage', JSON.stringify({
        state: {
          user: { id: '1', email: 'test@example.com', nickname: 'Test', createdAt: new Date().toISOString() },
          token: 'test-token',
          isLoggedIn: true,
        },
        version: 0,
      }));
    });

    // Navigate to login page
    await page.goto('/login');
    await page.waitForURL('**/');
  });
});
