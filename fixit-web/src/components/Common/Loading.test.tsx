// components/Common/Loading.test.tsx
// Loading 组件测试 - 简化版

import { render, screen } from '@testing-library/react';
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Loading, useFullScreenLoading } from './Loading';

describe('Loading', () => {
  it('渲染加载指示器', () => {
    render(<Loading />);
    const spinner = screen.getByRole('img', { hidden: true });
    expect(spinner).toBeTruthy();
  });

  it('fullScreen 模式渲染遮罩', () => {
    const { container } = render(<Loading fullScreen />);
    expect(container.querySelector('[style*="position: fixed"]')).toBeTruthy();
  });
});

describe('useFullScreenLoading', () => {
  it('初始化状态', () => {
    const { result } = renderHook(() => useFullScreenLoading());
    expect(result.current.loading).toBe(false);
  });

  it('show 方法', () => {
    const { result } = renderHook(() => useFullScreenLoading());
    act(() => result.current.show('加载'));
    expect(result.current.loading).toBe(true);
  });

  it('hide 方法', () => {
    const { result } = renderHook(() => useFullScreenLoading());
    act(() => result.current.show());
    act(() => result.current.hide());
    expect(result.current.loading).toBe(false);
  });
});
