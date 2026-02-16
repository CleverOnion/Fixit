// vitest.setup.ts
// Vitest 测试配置

import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';
import '@testing-library/jest-dom';

// 每个测试后清理
afterEach(() => {
  cleanup();
});

// Mock ResizeObserver (用于 Ant Design 组件)
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Extend expect with custom matchers
expect.extend({
  toBeInDocument(received) {
    const pass = received !== null && received !== undefined;
    return {
      pass,
      message: () => pass ? 'expected element not to be in document' : 'expected element to be in document',
    };
  },
});
