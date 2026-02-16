// components/Common/ConfirmModal.test.tsx
// ConfirmModal 组件测试 - 简化版

import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ConfirmModal } from "./ConfirmModal";
import userEvent from "@testing-library/user-event";

describe("ConfirmModal", () => {
  it("不打开时不渲染", () => {
    render(<ConfirmModal open={false} />);
    expect(screen.queryByRole("dialog")).toBeFalsy();
  });

  it("打开时显示对话框", () => {
    render(<ConfirmModal open title="标题" content="内容" />);
    expect(screen.getByRole("dialog")).toBeTruthy();
  });

  it("显示默认标题和内容", () => {
    render(<ConfirmModal open type="delete" />);
    expect(screen.getByText("确认删除")).toBeTruthy();
    expect(screen.getByText("此操作不可逆，确定要删除吗？")).toBeTruthy();
  });

  it("点击确认按钮触发 onConfirm", async () => {
    const onConfirm = vi.fn();
    const user = userEvent.setup();
    render(<ConfirmModal open onConfirm={onConfirm} />);
    await user.click(screen.getByText("确 定"));
    expect(onConfirm).toHaveBeenCalled();
  });

  it("点击取消按钮触发 onCancel", async () => {
    const onCancel = vi.fn();
    const user = userEvent.setup();
    render(<ConfirmModal open onCancel={onCancel} />);
    await user.click(screen.getByText("取 消"));
    expect(onCancel).toHaveBeenCalled();
  });
});
