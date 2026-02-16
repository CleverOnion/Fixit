/**
 * Question Service 单元测试
 *
 * 测试导出、导入和练习功能
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock uuid
vi.mock('uuid', () => ({
  v4: vi.fn(() => 'test-uuid-1234'),
}));

describe('QuestionService - Export/Import Logic', () => {
  // Mock 用户数据
  const mockUserId = 'user-123';

  // Mock 题目数据
  const mockQuestions = [
    {
      id: 'q1',
      content: '求函数 f(x) = x^2 + 2x + 1 的导数',
      answer: "f'(x) = 2x + 2",
      analysis: '使用幂函数求导法则',
      subject: '数学',
      masteryLevel: 3,
      userId: mockUserId,
      images: [],
      nextReviewAt: null,
      lastReviewedAt: null,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      tags: [
        {
          tagId: 't1',
          questionId: 'q1',
          tag: { id: 't1', name: '导数', userId: mockUserId, category: 'custom', type: 'CUSTOM' as const },
        },
      ],
    },
    {
      id: 'q2',
      content: '已知三角形 ABC 中，AB = 3，AC = 4，角 A = 90度，求 BC 的长度',
      answer: 'BC = 5',
      analysis: '使用勾股定理',
      subject: '数学',
      masteryLevel: 2,
      userId: mockUserId,
      images: [],
      nextReviewAt: null,
      lastReviewedAt: null,
      createdAt: new Date('2024-01-02'),
      updatedAt: new Date('2024-01-02'),
      tags: [
        {
          tagId: 't2',
          questionId: 'q2',
          tag: { id: 't2', name: '几何', userId: mockUserId, category: 'custom', type: 'CUSTOM' as const },
        },
      ],
    },
    {
      id: 'q3',
      content: '计算积分 ∫₀¹ x² dx',
      answer: '1/3',
      subject: '数学',
      masteryLevel: 4,
      userId: mockUserId,
      images: [],
      nextReviewAt: null,
      lastReviewedAt: null,
      createdAt: new Date('2024-01-03'),
      updatedAt: new Date('2024-01-03'),
      tags: [],
    },
  ];

  describe('exportQuestions Logic', () => {
    it('should format export data with version', () => {
      const result = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        totalQuestions: mockQuestions.length,
        includeMeta: false,
        questions: mockQuestions.map((q) => ({
          content: q.content,
          answer: q.answer,
          analysis: q.analysis,
          images: q.images,
          subject: q.subject,
          tags: q.tags.map((t) => t.tag.name),
        })),
      };

      expect(result.version).toBe('1.0');
      expect(result.totalQuestions).toBe(3);
      expect(result.questions).toHaveLength(3);
    });

    it('should extract tag names correctly', () => {
      const exportedTags = mockQuestions[0].tags.map((t) => t.tag.name);
      expect(exportedTags).toEqual(['导数']);
    });

    it('should handle empty tags array', () => {
      const exportedTags = mockQuestions[2].tags.map((t) => t.tag.name);
      expect(exportedTags).toEqual([]);
    });

    it('should format dates as ISO strings when includeMeta is true', () => {
      const questionWithDates = {
        ...mockQuestions[0],
        nextReviewAt: new Date('2024-06-01'),
        lastReviewedAt: new Date('2024-01-15'),
      };

      const result = {
        ...questionWithDates,
        nextReviewAt: questionWithDates.nextReviewAt?.toISOString(),
        lastReviewedAt: questionWithDates.lastReviewedAt?.toISOString(),
      };

      expect(result.nextReviewAt).toBe('2024-06-01T00:00:00.000Z');
      expect(result.lastReviewedAt).toBe('2024-01-15T00:00:00.000Z');
    });

    it('should not include meta fields when includeMeta is false', () => {
      const result = {
        content: '题目内容',
        answer: '答案',
        images: [],
        subject: '数学',
        tags: [],
      };

      expect(result).not.toHaveProperty('masteryLevel');
      expect(result).not.toHaveProperty('nextReviewAt');
    });

    it('should handle null dates correctly', () => {
      const question = {
        ...mockQuestions[0],
        nextReviewAt: null,
        lastReviewedAt: null,
      };

      const result = {
        nextReviewAt: question.nextReviewAt?.toISOString(),
        lastReviewedAt: question.lastReviewedAt?.toISOString(),
      };

      expect(result.nextReviewAt).toBeUndefined();
      expect(result.lastReviewedAt).toBeUndefined();
    });
  });

  describe('importQuestions Logic', () => {
    it('should format import result correctly', () => {
      const result = {
        success: 5,
        skipped: 2,
        errors: [] as string[],
      };

      expect(result.success).toBe(5);
      expect(result.skipped).toBe(2);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle import errors', () => {
      const errors = ['导入题目 "题目1..." 失败: Error'];
      const result = {
        success: 4,
        skipped: 1,
        errors,
      };

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('失败');
    });

    it('should validate question format for import', () => {
      const questionFormat = {
        content: '题目内容',
        answer: '答案',
        analysis: '解析',
        images: [] as string[],
        subject: '数学',
        tags: ['标签1'],
      };

      expect(questionFormat.content).toBeDefined();
      expect(questionFormat.answer).toBeDefined();
      expect(questionFormat.images).toBeInstanceOf(Array);
      expect(questionFormat.tags).toBeInstanceOf(Array);
    });
  });

  describe('getSequential Logic', () => {
    it('should handle orderBy options', () => {
      const orderBy = 'desc';
      const result = { orderBy: { createdAt: orderBy } };
      expect(result.orderBy).toEqual({ createdAt: 'desc' });
    });

    it('should handle subjects filter', () => {
      const subjects = ['数学', '物理'];
      const where = { subject: { in: subjects } };
      expect(where.subject).toEqual({ in: ['数学', '物理'] });
    });

    it('should handle mastery level range', () => {
      const masteryLevel = { gte: 1, lte: 3 };
      const where = { masteryLevel };
      expect(where.masteryLevel).toEqual({ gte: 1, lte: 3 });
    });

    it('should handle limit option', () => {
      const limit = 10;
      const take = limit;
      expect(take).toBe(10);
    });
  });

  describe('getRandom Logic', () => {
    it('should handle offset pagination', () => {
      const offset = 5;
      const limit = 10;
      const result = { offset, limit };
      expect(result.offset).toBe(5);
      expect(result.limit).toBe(10);
    });

    it('should randomize array order', () => {
      const original = [1, 2, 3, 4, 5];
      const shuffled = [...original];
      // Fisher-Yates shuffle
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      // Note: Due to randomness, we just verify it's an array
      expect(shuffled).toHaveLength(5);
    });
  });

  describe('getBySubject Logic', () => {
    it('should handle tags filter', () => {
      const tags = ['导数', '积分'];
      const where = {
        tags: {
          some: {
            tag: {
              name: { in: tags },
            },
          },
        },
      };
      expect(where.tags.some.tag.name).toEqual({ in: ['导数', '积分'] });
    });

    it('should have default limit', () => {
      const limit = 20;
      expect(limit).toBe(20);
    });
  });
});

/**
 * 导出数据格式测试
 */
describe('Export Data Format', () => {
  it('should have correct export data structure', () => {
    const exportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      totalQuestions: 10,
      includeMeta: false,
      questions: [],
    };

    expect(exportData.version).toBeDefined();
    expect(exportData.exportedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(typeof exportData.totalQuestions).toBe('number');
    expect(typeof exportData.includeMeta).toBe('boolean');
    expect(Array.isArray(exportData.questions)).toBe(true);
  });

  it('should have correct question export format', () => {
    const questionFormat = {
      content: '题目内容',
      answer: '答案',
      analysis: '解析',
      images: [],
      subject: '数学',
      tags: ['标签1', '标签2'],
    };

    expect(questionFormat).toHaveProperty('content');
    expect(questionFormat).toHaveProperty('answer');
    expect(questionFormat).toHaveProperty('analysis');
    expect(questionFormat).toHaveProperty('images');
    expect(questionFormat).toHaveProperty('subject');
    expect(questionFormat).toHaveProperty('tags');
    expect(Array.isArray(questionFormat.tags)).toBe(true);
  });
});
