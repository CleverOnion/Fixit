import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ExportModal } from "./ExportModal";
import { Question } from "../../api/question";

// Mock antd message module
vi.mock("antd/es/message", () => ({
  default: {
    warning: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

// Mock question data
const mockQuestions: Question[] = [
  {
    id: "1",
    content: "这是第一道题目",
    answer: "答案A",
    analysis: "这是解析内容",
    subject: "数学",
    masteryLevel: 2,
    practiceCount: 0,
    totalTimeSpent: 0,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    tags: [{ tag: { id: "1", name: "代数" } }],
  },
  {
    id: "2",
    content: "这是第二道题目",
    answer: "答案B",
    subject: "数学",
    masteryLevel: 3,
    practiceCount: 0,
    totalTimeSpent: 0,
    createdAt: "2024-01-02T00:00:00.000Z",
    updatedAt: "2024-01-02T00:00:00.000Z",
    tags: [{ tag: { id: "2", name: "几何" } }],
  },
];

// Mock window.URL.createObjectURL
const mockCreateObjectURL = vi.fn();
const mockRevokeObjectURL = vi.fn();
const mockClick = vi.fn();
const mockAppendChild = vi.fn();
const mockRemoveChild = vi.fn();

describe("ExportModal 组件测试", () => {
  const mockOnCancel = vi.fn();

  const defaultProps = {
    open: true,
    onCancel: mockOnCancel,
    questions: mockQuestions,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateObjectURL.mockReturnValue("blob:http://localhost/mock-url");

    // Mock DOM APIs
    vi.spyOn(document, "createElement").mockImplementation((tag) => {
      const el = document.createElement(tag);
      if (tag === "a") {
        el.click = mockClick;
      }
      return el;
    });
    vi.spyOn(document.body, "appendChild").mockImplementation(mockAppendChild);
    vi.spyOn(document.body, "removeChild").mockImplementation(mockRemoveChild);
    vi.spyOn(window.URL, "createObjectURL").mockImplementation(mockCreateObjectURL);
    vi.spyOn(window.URL, "revokeObjectURL").mockImplementation(mockRevokeObjectURL);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("基础渲染测试", () => {
    it("正确渲染模态框", () => {
      render(<ExportModal {...defaultProps} />);
      expect(screen.getByRole("dialog")).toBeTruthy();
    });

    it("显示正确的标题", () => {
      render(<ExportModal {...defaultProps} />);
      expect(screen.getByText("导出 PDF 试卷")).toBeTruthy();
    });

    it("显示题目数量和学科信息", () => {
      render(<ExportModal {...defaultProps} />);
      expect(screen.getByText("2 题")).toBeTruthy();
      expect(screen.getByText("数学")).toBeTruthy();
    });

    it("显示导出选项", () => {
      render(<ExportModal {...defaultProps} />);
      expect(screen.getByText("包含答案")).toBeTruthy();
      expect(screen.getByText("包含解析")).toBeTruthy();
      expect(screen.getByText("包含标签")).toBeTruthy();
    });
  });

  describe("选项交互测试", () => {
    it("点击取消按钮触发 onCancel", async () => {
      const user = userEvent.setup();
      render(<ExportModal {...defaultProps} />);
      const cancelButton = screen.getByRole("button", { name: /取\s*消/i });
      await user.click(cancelButton);
      expect(mockOnCancel).toHaveBeenCalled();
    });

    it("点击导出按钮显示进度条", async () => {
      const user = userEvent.setup();

      // Mock html2pdf.js
      const mockHtml2pdf = vi.fn().mockReturnValue({
        set: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        save: vi.fn().mockResolvedValue(undefined),
      });
      vi.stubGlobal("import", vi.fn().mockResolvedValue({ default: mockHtml2pdf }));

      render(<ExportModal {...defaultProps} />);

      const exportButton = screen.getByRole("button", { name: /导出 PDF/i });
      await user.click(exportButton);

      // Verify progress bar appears
      await waitFor(() => {
        expect(screen.getByRole("progressbar")).toBeTruthy();
      });
    });

    it("切换包含解析选项", async () => {
      const user = userEvent.setup();
      render(<ExportModal {...defaultProps} />);

      const checkbox = screen.getByRole("checkbox", { name: /包含解析/i });
      await user.click(checkbox);

      expect((checkbox as HTMLInputElement).checked).toBe(true);
    });
  });

  describe("边界情况测试", () => {
    it("空题目列表时模态框仍然渲染", () => {
      render(<ExportModal {...defaultProps} questions={[]} />);
      expect(screen.getByRole("dialog")).toBeTruthy();
    });

    it("空题目列表时导出按钮禁用", () => {
      render(<ExportModal {...defaultProps} questions={[]} />);
      const exportButton = screen.getByRole("button", { name: /导出 PDF/i });
      expect((exportButton as HTMLButtonElement).disabled).toBe(true);
    });

    it("多学科时显示综合", () => {
      const mixedQuestions: Question[] = [
        { ...mockQuestions[0], subject: "数学" },
        { ...mockQuestions[1], subject: "物理" },
      ];
      render(<ExportModal {...defaultProps} questions={mixedQuestions} />);
      expect(screen.getByText("综合")).toBeTruthy();
    });

    it("单学科时显示学科名称", () => {
      render(<ExportModal {...defaultProps} />);
      expect(screen.getByText("数学")).toBeTruthy();
    });
  });

  describe("导出流程测试", () => {
    it("导出成功后关闭模态框", async () => {
      const user = userEvent.setup();

      // Mock html2pdf.js
      const mockSave = vi.fn().mockResolvedValue(undefined);
      vi.stubGlobal("import", vi.fn().mockResolvedValue({
        default: vi.fn().mockReturnValue({
          set: vi.fn().mockReturnThis(),
          from: vi.fn().mockReturnThis(),
          save: mockSave,
        }),
      }));

      render(<ExportModal {...defaultProps} />);

      const exportButton = screen.getByRole("button", { name: /导出 PDF/i });
      await user.click(exportButton);

      // Wait for export to complete
      await waitFor(() => {
        expect(mockOnCancel).toHaveBeenCalled();
      }, { timeout: 2000 });
    });

    it("空题目时显示警告并阻止导出", async () => {
      const user = userEvent.setup();
      const mockMessageWarning = vi.fn();
      const message = await import("antd/es/message");
      vi.spyOn(message, "default", "get").mockReturnValue({
        warning: mockMessageWarning,
      } as any);

      render(<ExportModal {...defaultProps} questions={[]} />);

      const exportButton = screen.getByRole("button", { name: /导出 PDF/i });
      await user.click(exportButton);

      expect(mockMessageWarning).toHaveBeenCalledWith("没有可导出的题目");
    });
  });
});
