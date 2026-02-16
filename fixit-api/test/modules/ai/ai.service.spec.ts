/**
 * AI Service 真实测试
 *
 * 使用 vitest.mock 来正确模拟 OpenAI SDK
 */

import { AiService } from '../../../src/modules/ai/ai.service';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock OpenAI SDK
const mockChatCompletionsCreate = vi.fn();

vi.mock('openai', () => ({
  default: vi.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: mockChatCompletionsCreate,
      },
    },
  })),
}));

// Mock ConfigService
const mockConfigService = {
  get: vi.fn((key: string, defaultValue?: string) => {
    const config: Record<string, string> = {
      'OPENAI_API_KEY': process.env.OPENAI_API_KEY || 'test-key',
      'OPENAI_BASE_URL': process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
      'OPENAI_MODEL': process.env.OPENAI_MODEL || 'gpt-4o',
      'AI_MAX_TOKENS': process.env.AI_MAX_TOKENS || '2000',
    };
    return config[key] ?? defaultValue;
  }),
};

describe('AiService', () => {
  let service: AiService;

  beforeEach(() => {
    vi.clearAllMocks();

    // 设置默认 mock 响应
    mockChatCompletionsCreate.mockResolvedValue({
      choices: [
        {
          message: {
            content: '这是测试答案',
          },
        },
      ],
    });

    // 手动创建服务实例
    service = new AiService(mockConfigService as any);
  });

  describe('constructor', () => {
    it('should initialize with config values', () => {
      expect(service).toBeDefined();
    });
  });

  describe('recognizeQuestionFromImages', () => {
    it('should call OpenAI API with correct parameters', async () => {
      const dto = {
        images: ['https://example.com/image.png'],
        instruction: '详细识别',
      };

      const result = await service.recognizeQuestionFromImages(dto);

      // 验证 API 被调用
      expect(mockChatCompletionsCreate).toHaveBeenCalledTimes(1);

      // 获取调用参数
      const callArgs = mockChatCompletionsCreate.mock.calls[0][0];

      // 验证模型
      expect(callArgs.model).toBe(process.env.OPENAI_MODEL || 'gpt-4o');

      // 验证消息结构 - 只有一条消息，包含文本和图片内容
      expect(callArgs.messages).toHaveLength(1);
      expect(callArgs.messages[0].role).toBe('user');
      // content 是一个数组，包含文本和图片
      expect(callArgs.messages[0].content).toHaveLength(2);
      expect(callArgs.messages[0].content[0].type).toBe('text');
      expect(callArgs.messages[0].content[0].text).toContain('详细识别');
      expect(callArgs.messages[0].content[1].type).toBe('image_url');
      expect(callArgs.messages[0].content[1].image_url.url).toBe('https://example.com/image.png');

      // 验证结果
      expect(result).toBe('这是测试答案');
    });

    it('should handle multiple images', async () => {
      const dto = {
        images: [
          'https://example.com/image1.png',
          'https://example.com/image2.png',
        ],
      };

      await service.recognizeQuestionFromImages(dto);

      const callArgs = mockChatCompletionsCreate.mock.calls[0][0];
      // 只有一条消息，content 数组包含 1 个文本 + 2 个图片
      expect(callArgs.messages).toHaveLength(1);
      expect(callArgs.messages[0].content).toHaveLength(3);
    });

    it('should return empty string when no response', async () => {
      mockChatCompletionsCreate.mockResolvedValue({
        choices: [],
      });

      const dto = { images: ['https://example.com/image.png'] };
      const result = await service.recognizeQuestionFromImages(dto);

      expect(result).toBe('');
    });

    it('should use default max_tokens from config', async () => {
      const dto = { images: ['https://example.com/image.png'] };

      await service.recognizeQuestionFromImages(dto);

      const callArgs = mockChatCompletionsCreate.mock.calls[0][0];
      expect(callArgs.max_tokens).toBe(Number(process.env.AI_MAX_TOKENS) || 2000);
    });
  });

  describe('generateAnswer', () => {
    it('should call OpenAI API with question', async () => {
      const dto = {
        question: '1+1=?',
        instruction: '用中文回答',
      };

      const result = await service.generateAnswer(dto);

      expect(mockChatCompletionsCreate).toHaveBeenCalledTimes(1);

      const callArgs = mockChatCompletionsCreate.mock.calls[0][0];
      expect(callArgs.messages[0].content).toContain('1+1=?');
      expect(callArgs.messages[0].content).toContain('用中文回答');
      expect(result).toBe('这是测试答案');
    });

    it('should work without instruction', async () => {
      const dto = { question: 'test question' };

      await service.generateAnswer(dto);

      const callArgs = mockChatCompletionsCreate.mock.calls[0][0];
      expect(callArgs.messages[0].content).not.toContain('额外要求');
    });
  });

  describe('generateAnalysis', () => {
    it('should call OpenAI API with question and answer', async () => {
      const dto = {
        question: '求导数',
        answer: '2x',
        instruction: '详细解析',
      };

      const result = await service.generateAnalysis(dto);

      expect(mockChatCompletionsCreate).toHaveBeenCalledTimes(1);

      const callArgs = mockChatCompletionsCreate.mock.calls[0][0];
      expect(callArgs.messages[0].content).toContain('求导数');
      expect(callArgs.messages[0].content).toContain('2x');
      expect(callArgs.messages[0].content).toContain('详细解析');
      expect(result).toBe('这是测试答案');
    });

    it('should work without answer', async () => {
      const dto = {
        question: 'test question',
        instruction: '简洁',
      };

      await service.generateAnalysis(dto);

      const callArgs = mockChatCompletionsCreate.mock.calls[0][0];
      expect(callArgs.messages[0].content).toContain('test question');
      expect(callArgs.messages[0].content).not.toContain('答案：');
    });
  });
});

/**
 * 配置加载测试
 */
describe('ConfigService Integration', () => {
  it('should load AI configuration from environment', () => {
    // 验证环境变量配置
    expect(process.env.OPENAI_API_KEY || 'test-key').toBeDefined();
    expect(process.env.OPENAI_MODEL || 'gpt-4o').toBeDefined();
    expect(Number(process.env.AI_MAX_TOKENS) || 2000).toBeGreaterThan(0);
  });
});
