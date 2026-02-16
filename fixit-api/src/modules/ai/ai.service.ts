import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { ConfigService } from '@nestjs/config';
import { RecognizeQuestionDto, GenerateAnswerDto, GenerateAnalysisDto, RecognizeQuestionResponse } from './dto/ai.dto';

// OpenAI Chat 内容部分类型
type ChatContentPart =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string } };

@Injectable()
export class AiService {
  private openai: OpenAI;
  private model: string;
  private maxTokens: number;

  constructor(private configService: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
      baseURL: this.configService.get<string>('OPENAI_BASE_URL'),
    });
    this.model = this.configService.get<string>('OPENAI_MODEL', 'gpt-4o');
    this.maxTokens = Number(this.configService.get<string>('AI_MAX_TOKENS', '2000'));
  }

  async recognizeQuestionFromImages(dto: RecognizeQuestionDto): Promise<RecognizeQuestionResponse> {
    const { images, instruction } = dto;

    // 根据识别目标设置不同的提示词
    let userPrompt = '';
    let targetType: 'content' | 'answer' | 'analysis' = 'content';

    if (instruction) {
      if (instruction.includes('全部') || instruction.includes('完整')) {
        targetType = 'content';
        userPrompt = `请从图片中完整提取题目内容、答案和解析，遵循以下规则：

【必须执行的规则】
1. 完整提取题目内容（含选项）
2. 完整提取答案部分（选择题的 A/B/C/D 选项，或填空题的答案）
3. 完整提取解题过程/解析
4. 数学公式使用规范的 LaTeX 格式，如 $x^2$、$\frac{a}{b}$、$\sqrt{x}$、$a_{n}$、$a^n$、$\sum_{i=1}^{n}$ 等
5. 化学方程式使用规范格式，如 $2H_2 + O_2 \\rightarrow 2H_2O$
6. 直接返回内容，不要添加任何解释或说明文字

【重要说明】
- 如果图片中包含"答案："、"解："、"解析："等文字，这些属于答案/解析部分，不是题目内容
- 如果图片中包含选择题选项（如 (A)、(B)、(C)、(D) 或 A.、B.、C.、D.），选项属于题目内容
- 题目内容应该只包含题目本身和选项，不要包含解题过程

【输出格式】
使用三个 Markdown 标题分隔：

## 题目内容
（题目原文，含选项）

## 答案
（答案内容）

## 解析
（解题过程和解析）

【最终输出】
严格按照上述格式返回内容，不要有任何前缀或说明。`;
      } else if (instruction.includes('题目内容')) {
        targetType = 'content';
        userPrompt = `请从图片中提取题目内容，遵循以下规则：

【必须执行的规则】
1. 只提取题目本身和选项，不要任何解题过程、答案、解析
2. 删除所有"解："、"答案："、"应选："、"解析："、"解"等文字
3. 如果图片中有单独标注的答案区域，不要把答案包含进来
4. 保留选项字母和内容，格式如 "(A) 选项内容"、"B. 选项内容"
5. 数学公式使用规范的 LaTeX 格式，如 $x^2$、$\frac{a}{b}$、$\sqrt{x}$、$a_{n}$、$a^n$、$\sum_{i=1}^{n}$ 等
6. 化学方程式使用规范格式，如 $2H_2 + O_2 \\rightarrow 2H_2O$
7. 直接返回题目原文，不要添加任何解释或说明文字

【重要说明】
- 如果图片中明确标注了"答案："或选项在题目下方，这些属于答案部分，不要包含
- 只提取最上方的题目主干和选项部分

【示例】
输入：如果函数 $f(x)=x^{2}+2mx+m^{2}$ 在区间 $[-1,1]$ 上的最大值是 4，则 m=____。
解：由题意得...
答案：B

输出：如果函数 $f(x)=x^{2}+2mx+m^{2}$ 在区间 $[-1,1]$ 上的最大值是 4，则 m=____。

或（选择题）：
输入：设函数 $f(x) = (e^x - 1)(e^{2x} - 2)\cdots(e^{nx} - n)$，则 $f'(0) = (\text{A})$。
(A) $(-1)^{n-1}(n-1)!$
(B) $(-1)^n(n-1)!$
(C) $(-1)^{n-1}n!$
(D) $(-1)^n n!$。

输出：设函数 $f(x) = (e^x - 1)(e^{2x} - 2)\cdots(e^{nx} - n)$，则 $f'(0) = (\text{A})$。
(A) $(-1)^{n-1}(n-1)!$
(B) $(-1)^n(n-1)!$
(C) $(-1)^{n-1}n!$
(D) $(-1)^n n!$。

【最终输出】
只返回处理后的题目内容（含选项），不要任何前缀或说明。`;
      } else if (instruction.includes('答案')) {
        targetType = 'answer';
        userPrompt = `请从图片中提取答案部分，遵循以下规则：

【必须执行的规则】
1. 只提取答案本身，不要解题过程或解析
2. 如果答案是选择题，提取选项字母（如 A、B、C、D）
3. 如果答案是填空题，提取完整的答案内容
4. 数学公式使用规范的 LaTeX 格式
5. 直接返回答案，不要添加任何解释或说明文字

【示例】
输入：...（包含题目和答案的图片）

输出：B

或

输出：$-1$

【最终输出】
只返回答案内容，不要任何前缀或说明。`;
      } else if (instruction.includes('解析')) {
        targetType = 'analysis';
        userPrompt = `请从图片中提取解析部分，遵循以下规则：

【必须执行的规则】
1. 只提取解题思路和解析过程
2. 不要包含题目内容本身
3. 数学公式使用规范的 LaTeX 格式
4. 直接返回解析内容，不要添加任何解释或说明文字

【最终输出】
只返回解析内容，不要任何前缀或说明。`;
      } else {
        // 默认只提取题目内容
        userPrompt = `请从图片中提取题目内容，遵循以下规则：

【必须执行的规则】
1. 只提取题目本身和选项，不要任何解题过程、答案、解析
2. 删除所有"解："、"答案："、"应选："、"解析："、"解"等文字
3. 保留选项字母和内容
4. 数学公式使用规范的 LaTeX 格式
5. 直接返回题目原文，不要添加任何解释或说明文字

【最终输出】
只返回处理后的题目内容（含选项），不要任何前缀或说明。`;
      }
    } else {
      // 默认只提取题目内容
      userPrompt = `请从图片中提取题目内容，遵循以下规则：

【必须执行的规则】
1. 只提取题目本身和选项，不要任何解题过程、答案、解析
2. 删除所有"解："、"答案："、"应选："、"解析："、"解"等文字
3. 保留选项字母和内容
4. 数学公式使用规范的 LaTeX 格式
5. 直接返回题目原文，不要添加任何解释或说明文字

【最终输出】
只返回处理后的题目内容（含选项），不要任何前缀或说明。`;
    }

    // 构建消息 - 图片使用 base64
    const messages: Array<{ role: string; content: string | Array<ChatContentPart> }> = [
      {
        role: 'user',
        content: [
          ...images.map((url): ChatContentPart => ({
            type: 'image_url' as const,
            image_url: { url }
          })),
          { type: 'text' as const, text: userPrompt }
        ]
      }
    ];

    const response = await this.openai.chat.completions.create({
      model: this.model,
      messages: messages as never[],
      max_tokens: this.maxTokens,
    });

    const resultText = response.choices[0]?.message?.content || '';

    // 解析完整识别的返回内容
    if (targetType === 'content' && (instruction?.includes('全部') || instruction?.includes('完整'))) {
      // 解析 ## 题目内容 / ## 答案 / ## 解析 格式
      const contentMatch = resultText.match(/##\s*题目内容\s*\n([\s\S]*?)(?=##\s*答案\s*\n|$)/);
      const answerMatch = resultText.match(/##\s*答案\s*\n([\s\S]*?)(?=##\s*解析\s*\n|$)/);
      const analysisMatch = resultText.match(/##\s*解析\s*\n([\s\S]*)/);

      return {
        content: contentMatch?.[1]?.trim() || null,
        answer: answerMatch?.[1]?.trim() || null,
        analysis: analysisMatch?.[1]?.trim() || null,
      };
    }

    // 根据目标类型返回对应字段
    if (targetType === 'content') {
      return {
        content: resultText.trim(),
        answer: null,
        analysis: null,
      };
    } else if (targetType === 'answer') {
      return {
        content: null,
        answer: resultText.trim(),
        analysis: null,
      };
    } else {
      return {
        content: null,
        answer: null,
        analysis: resultText.trim(),
      };
    }
  }

  async generateAnswer(dto: GenerateAnswerDto): Promise<string> {
    const { question, instruction } = dto;

    const userPrompt = instruction
      ? `根据以下题目生成答案。\n\n题目：${question}\n\n额外要求：${instruction}`
      : `根据以下题目生成答案。\n\n题目：${question}`;

    const response = await this.openai.chat.completions.create({
      model: this.model,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      max_tokens: this.maxTokens,
    });

    return response.choices[0]?.message?.content || '';
  }

  async generateAnalysis(dto: GenerateAnalysisDto): Promise<string> {
    const { question, answer, instruction } = dto;

    let userPrompt = `根据以下题目生成解析。\n\n题目：${question}`;

    if (answer) {
      userPrompt += `\n\n答案：${answer}`;
    }

    if (instruction) {
      userPrompt += `\n\n额外要求：${instruction}`;
    }

    const response = await this.openai.chat.completions.create({
      model: this.model,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      max_tokens: this.maxTokens,
    });

    return response.choices[0]?.message?.content || '';
  }
}
