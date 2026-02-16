import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AiService } from './ai.service';
import { RecognizeQuestionDto, GenerateAnswerDto, GenerateAnalysisDto, RecognizeQuestionResponse } from './dto/ai.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(private aiService: AiService) {}

  /**
   * 从图片识别题目内容、答案和解析
   */
  @Post('recognize-question')
  async recognizeQuestion(@Body() dto: RecognizeQuestionDto): Promise<RecognizeQuestionResponse> {
    const result = await this.aiService.recognizeQuestionFromImages(dto);
    return result;
  }

  /**
   * 生成答案
   */
  @Post('generate-answer')
  async generateAnswer(@Body() dto: GenerateAnswerDto) {
    const result = await this.aiService.generateAnswer(dto);
    return { answer: result };
  }

  /**
   * 生成解析
   */
  @Post('generate-analysis')
  async generateAnalysis(@Body() dto: GenerateAnalysisDto) {
    const result = await this.aiService.generateAnalysis(dto);
    return { analysis: result };
  }
}
