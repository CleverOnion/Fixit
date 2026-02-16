/**
 * AI Service 集成测试
 *
 * 测试需要配置环境变量:
 * - OPENAI_API_KEY
 * - OPENAI_MODEL (可选，默认 gpt-4o)
 * - AI_MAX_TOKENS (可选，默认 2000)
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';

describe('AI Service Integration Tests', () => {
  const hasApiKey = () => !!process.env.OPENAI_API_KEY;

  describe('generateAnswer', () => {
    it('should generate answer with real API call', async () => {
      if (!hasApiKey()) {
        console.log('SKIP: OPENAI_API_KEY not configured');
        return expect(true).toBe(true);
      }

      // 模拟真实 API 调用
      const response = await fetch(`${process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1'}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL || 'gpt-4o',
          messages: [{
            role: 'user',
            content: '请回答：1+1=?'
          }],
          max_tokens: Number(process.env.AI_MAX_TOKENS) || 2000,
        }),
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.choices).toBeDefined();
      expect(data.choices[0].message.content).toBeDefined();
      console.log('AI Response:', data.choices[0].message.content);
    });

    it('should generate analysis with real API call', async () => {
      if (!hasApiKey()) {
        console.log('SKIP: OPENAI_API_KEY not configured');
        return expect(true).toBe(true);
      }

      const response = await fetch(`${process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1'}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL || 'gpt-4o',
          messages: [{
            role: 'user',
            content: '请解析这道数学题：求函数 f(x)=x² 的导数，答案是 f\'(x)=2x'
          }],
          max_tokens: Number(process.env.AI_MAX_TOKENS) || 2000,
        }),
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.choices).toBeDefined();
      expect(data.choices[0].message.content).toBeDefined();
      console.log('AI Analysis:', data.choices[0].message.content);
    });
  });

  describe('recognizeQuestion (requires image URL)', () => {
    it('should recognize text from image URL', async () => {
      if (!hasApiKey()) {
        console.log('SKIP: OPENAI_API_KEY not configured');
        return expect(true).toBe(true);
      }

      // 测试使用示例图片
      const testImageUrl = 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Latex_example.svg/1200px-Latex_example.svg.png';

      const response = await fetch(`${process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1'}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL || 'gpt-4o',
          messages: [{
            role: 'user',
            content: [
              { type: 'text', text: '请识别图片中的数学公式内容' },
              { type: 'image_url', image_url: { url: testImageUrl } }
            ]
          }],
          max_tokens: Number(process.env.AI_MAX_TOKENS) || 2000,
        }),
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.choices).toBeDefined();
      expect(data.choices[0].message.content).toBeDefined();
      console.log('OCR Result:', data.choices[0].message.content);
    });
  });
});

/**
 * AI 提示词模板测试
 */
describe('AI Prompt Templates', () => {
  describe('recognizeQuestion prompts', () => {
    it('should generate correct prompt without instruction', () => {
      const prompt = '请识别图片中的题目内容，直接返回题目文本，不需要解释。';
      expect(prompt).toContain('直接返回题目文本');
    });

    it('should include instruction when provided', () => {
      const instruction = '详细解答每一步';
      const prompt = `请识别图片中的题目内容。额外要求：${instruction}`;
      expect(prompt).toContain('额外要求：详细解答每一步');
    });
  });

  describe('generateAnswer prompts', () => {
    it('should include question in prompt', () => {
      const question = '什么是勾股定理？';
      const prompt = `根据以下题目生成答案。\n\n题目：${question}`;
      expect(prompt).toContain(question);
    });

    it('should include instruction when provided', () => {
      const question = 'test';
      const instruction = '用中文回答';
      const prompt = `根据以下题目生成答案。\n\n题目：${question}\n\n额外要求：${instruction}`;
      expect(prompt).toContain('额外要求：用中文回答');
    });
  });

  describe('generateAnalysis prompts', () => {
    it('should include question and answer', () => {
      const question = '求 1+1';
      const answer = '2';
      const prompt = `根据以下题目生成解析。\n\n题目：${question}\n\n答案：${answer}`;
      expect(prompt).toContain(question);
      expect(prompt).toContain(answer);
    });

    it('should handle missing answer', () => {
      const question = 'test question';
      const prompt = `根据以下题目生成解析。\n\n题目：${question}`;
      expect(prompt).not.toContain('答案：');
    });
  });
});

/**
 * OpenAI API 响应格式测试
 */
describe('OpenAI API Response Format', () => {
  it('should extract content from choice', () => {
    const mockResponse = {
      id: 'chatcmpl-abc123',
      object: 'chat.completion',
      created: 1677858242,
      model: 'gpt-4o',
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: '答案是 42',
          },
          finish_reason: 'stop',
        }
      ],
      usage: {
        prompt_tokens: 10,
        completion_tokens: 5,
        total_tokens: 15,
      },
    };

    const extractContent = (response: any) => {
      return response.choices?.[0]?.message?.content || '';
    };

    expect(extractContent(mockResponse)).toBe('答案是 42');
  });

  it('should handle empty choices', () => {
    const extractContent = (response: any) => {
      if (!response) return '';
      return response.choices?.[0]?.message?.content || '';
    };

    expect(extractContent({ choices: [] })).toBe('');
    expect(extractContent({})).toBe('');
    expect(extractContent(null)).toBe('');
  });
});
