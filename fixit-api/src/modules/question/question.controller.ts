import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  Res,
  StreamableFile,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import { QuestionService } from './question.service';
import { CreateQuestionDto, UpdateQuestionDto, QuestionFilterDto, PracticeFilterDto, ExportData } from './dto/question.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PdfService } from '../pdf/pdf.service';

@Controller('questions')
@UseGuards(JwtAuthGuard)
export class QuestionController {
  constructor(
    private questionService: QuestionService,
    private pdfService: PdfService,
  ) {}

  @Post()
  async create(@Request() req: any, @Body() dto: CreateQuestionDto) {
    return this.questionService.create(req.user.sub, dto);
  }

  @Get()
  async findAll(@Request() req: any, @Query() filter: QuestionFilterDto) {
    return this.questionService.findAll(req.user.sub, filter);
  }

  @Get('subjects')
  async getSubjects(@Request() req: any, @Query('search') search?: string) {
    return this.questionService.getSubjects(req.user.sub, search);
  }

  // 顺序刷题
  @Get('sequential')
  async getSequential(
    @Request() req: any,
    @Query() filter: PracticeFilterDto,
  ) {
    const questions = await this.questionService.getSequential(req.user.sub, {
      subjects: filter.subjects,
      tags: filter.tags,
      minMasteryLevel: filter.minMasteryLevel,
      maxMasteryLevel: filter.maxMasteryLevel,
      limit: filter.limit,
      orderBy: filter.orderBy,
    });
    return {
      data: questions,
      count: questions.length,
    };
  }

  // 随机练习
  @Get('random')
  async getRandom(
    @Request() req: any,
    @Query() filter: PracticeFilterDto,
  ) {
    const questions = await this.questionService.getRandom(req.user.sub, {
      subjects: filter.subjects,
      tags: filter.tags,
      minMasteryLevel: filter.minMasteryLevel,
      maxMasteryLevel: filter.maxMasteryLevel,
      limit: filter.limit,
      offset: filter.offset,
    });
    return {
      data: questions,
      count: questions.length,
    };
  }

  // 随机抽题（创建练习轮次）
  @Post('random')
  @HttpCode(HttpStatus.OK)
  async randomPick(
    @Request() req: any,
    @Body() body: {
      limit?: number;
      subjects?: string[];
      tags?: string[];
      minMasteryLevel?: number;
      maxMasteryLevel?: number;
    },
  ) {
    return this.questionService.randomPick(req.user.sub, body);
  }

  // 专项训练
  @Get('by-subject')
  async getBySubject(
    @Request() req: any,
    @Query() filter: PracticeFilterDto,
  ) {
    const questions = await this.questionService.getBySubject(req.user.sub, {
      subjects: filter.subjects,
      tags: filter.tags,
      limit: filter.limit,
    });
    return {
      data: questions,
      count: questions.length,
    };
  }

  // 导出题目
  @Get('export')
  async exportQuestions(
    @Request() req: any,
    @Query('includeMeta') includeMeta: string = 'false',
    @Res({ passthrough: true }) res: Response,
  ) {
    const includeMetaBool = includeMeta === 'true';
    const data = await this.questionService.exportQuestions(req.user.sub, includeMetaBool);

    const jsonStr = JSON.stringify(data, null, 2);
    const buffer = Buffer.from(jsonStr, 'utf-8');

    const filename = `fixit-questions-${new Date().toISOString().split('T')[0]}.json`;

    res.set({
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length,
    });

    return new StreamableFile(buffer);
  }

  // 导出 PDF
  @Get('export-pdf')
  async exportPdf(
    @Request() req: any,
    @Query('questionIds') questionIds: string | undefined,
    @Query('includeAnswer') includeAnswer: string = 'true',
    @Query('includeAnalysis') includeAnalysis: string = 'false',
    @Query('includeTags') includeTags: string = 'true',
    @Res({ passthrough: true }) res: Response,
  ) {
    // 解析题目 ID 列表
    const ids = questionIds ? questionIds.split(',') : [];

    // 获取题目数据
    let questions;
    if (ids.length > 0) {
      // 导出指定题目
      questions = await this.questionService.getByIds(req.user.sub, ids);
    } else {
      // 导出全部题目
      questions = await this.questionService.getAllForExport(req.user.sub);
    }

    if (questions.length === 0) {
      throw new Error('没有可导出的题目');
    }

    // 确定学科
    const subjects = [...new Set(questions.map((q) => q.subject))];
    const subject: string | undefined = subjects.length === 1 ? subjects[0] as string : undefined;

    // 生成 PDF
    const pdfBuffer = await this.pdfService.generateQuestionsPdf(questions, {
      includeAnswer: includeAnswer === 'true',
      includeAnalysis: includeAnalysis === 'true',
      includeTags: includeTags === 'true',
      subject,
    });

    const filename = this.pdfService.generateFilename(subject);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': pdfBuffer.length,
    });

    return new StreamableFile(pdfBuffer);
  }

  // 导入题目
  @Post('import')
  async importQuestions(
    @Request() req: any,
    @Body() body: { data: ExportData; includeMeta: boolean },
  ) {
    const { data, includeMeta } = body;
    const results = await this.questionService.importQuestions(req.user.sub, data, includeMeta);
    return results;
  }

  @Get(':id')
  async findOne(@Request() req: any, @Param('id') id: string) {
    return this.questionService.findOne(req.user.sub, id);
  }

  @Put(':id')
  async update(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateQuestionDto,
  ) {
    return this.questionService.update(req.user.sub, id, dto);
  }

  @Delete(':id')
  async delete(@Request() req: any, @Param('id') id: string) {
    return this.questionService.delete(req.user.sub, id);
  }
}
