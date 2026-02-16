// components/Common/EmptyState.test.tsx
// EmptyState 组件测试 - 简化版

import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { EmptyState, EmptyStates } from "./EmptyState";

describe("EmptyState", () => {
  it("渲染空状态容器", () => {
    render(<EmptyState />);
    expect(screen.getByText("暂无数据")).toBeTruthy();
  });

  it("渲染操作按钮", () => {
    const onClick = vi.fn();
    render(<EmptyState action={{ label: "操作", onClick }} />);
    expect(screen.getByRole("button", { name: /操作/i })).toBeTruthy();
  });
});

describe("EmptyStates presets", () => {
  it("noQuestions 预设渲染", () => {
    render(EmptyStates.noQuestions());
    expect(screen.getByText("📝")).toBeTruthy();
  });

  it("noSearchResults 预设渲染", () => {
    render(EmptyStates.noSearchResults());
    expect(screen.getByText("🔍")).toBeTruthy();
  });
});
