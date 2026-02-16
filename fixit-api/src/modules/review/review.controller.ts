import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ReviewService } from './review.service';
import {
  SubmitReviewDto,
  ReviewFilterDto,
  PendingReviewDto,
  ReviewStatus,
  ManualReviewDto,
  PracticeSessionStatus,
  StartPracticeDto,
  DailyPracticeStatusDto,
  CompleteDailyPracticeDto,
} from './dto/review.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('reviews')
@UseGuards(JwtAuthGuard)
export class ReviewController {
  constructor(private reviewService: ReviewService) {}

  // 获取待复习题目（支持筛选）
  @Get('pending')
  async getPendingReviews(@Request() req: any, @Query() query: PendingReviewDto) {
    const reviews = await this.reviewService.getPendingReviews(req.user.sub, {
      limit: query.limit || 10,
      subjects: query.subjects,
      tags: query.tags,
      minMasteryLevel: query.minMasteryLevel,
      maxMasteryLevel: query.maxMasteryLevel,
    });
    return {
      data: reviews,
      count: reviews.length,
    };
  }

  // 提交复习结果
  @Post()
  @HttpCode(HttpStatus.OK)
  async submitReview(@Request() req: any, @Body() dto: SubmitReviewDto) {
    const result = await this.reviewService.submitReview(req.user.sub, dto);
    return {
      message: result.message,
      data: {
        masteryLevel: result.question.masteryLevel,
        nextReviewAt: result.nextReviewAt,
      },
    };
  }

  // 获取复习历史
  @Get('history')
  async getReviewHistory(@Request() req: any, @Query() query: ReviewFilterDto) {
    return this.reviewService.getReviewHistory(
      req.user.sub,
      query.page || 1,
      query.pageSize || 20,
    );
  }

  // 获取复习统计
  @Get('stats')
  async getStats(@Request() req: any) {
    return this.reviewService.getReviewStats(req.user.sub);
  }

  // 获取今日待复习数量
  @Get('today-count')
  async getTodayCount(@Request() req: any) {
    const count = await this.reviewService.getTodayReviewCount(req.user.sub);
    return { count };
  }

  // 获取学习热力图数据
  @Get('heatmap')
  async getHeatmap(@Request() req: any) {
    return this.reviewService.getHeatmapData(req.user.sub);
  }

  // 获取连续学习数据
  @Get('streak')
  async getStreak(@Request() req: any) {
    return this.reviewService.getStreakData(req.user.sub);
  }

  // 获取月度日历数据
  @Get('calendar')
  async getCalendar(
    @Request() req: any,
    @Query('year') year: string,
    @Query('month') month: string,
  ) {
    return this.reviewService.getCalendarData(
      req.user.sub,
      parseInt(year) || new Date().getFullYear(),
      parseInt(month) || new Date().getMonth() + 1,
    );
  }

  // 复习状态选项
  @Get('status-options')
  getStatusOptions() {
    return [
      { label: '没做对 (Forgot)', value: ReviewStatus.FORGOTTEN },
      { label: '有点模糊 (Fuzzy)', value: ReviewStatus.FUZZY },
      { label: '完全掌握 (Mastered)', value: ReviewStatus.MASTERED },
    ];
  }

  // 手动标记刷题（从题库）
  @Post('manual')
  @HttpCode(HttpStatus.OK)
  async manualReview(@Request() req: any, @Body() dto: ManualReviewDto) {
    const result = await this.reviewService.submitReview(req.user.sub, dto);
    return {
      message: result.message,
      data: {
        masteryLevel: result.question.masteryLevel,
        nextReviewAt: result.nextReviewAt,
      },
    };
  }

  // 获取今日练习统计
  @Get('today-stats')
  async getTodayStats(@Request() req: any) {
    return this.reviewService.getTodayStats(req.user.sub);
  }

  // ============================================
  // 每日练习相关 API
  // ============================================

  // 获取每日练习状态
  @Get('daily-status')
  async getDailyPracticeStatus(@Request() req: any) {
    return this.reviewService.getDailyPracticeStatus(req.user.sub);
  }

  // 完成今日练习
  @Post('daily/finish')
  @HttpCode(HttpStatus.OK)
  async completeDailyPractice(@Request() req: any) {
    return this.reviewService.completeDailyPractice(req.user.sub);
  }

  // 重置/再开一轮
  @Post('daily/reset')
  @HttpCode(HttpStatus.OK)
  async resetDailyPractice(
    @Request() req: any,
    @Body() body: { dailyLimit?: number },
  ) {
    return this.reviewService.resetDailyPractice(req.user.sub, body.dailyLimit);
  }

  // ============================================
  // 练习轮次相关 API
  // ============================================

  // 开始练习轮次
  @Post('session/start')
  @HttpCode(HttpStatus.OK)
  async startPracticeSession(@Request() req: any, @Body() dto: StartPracticeDto) {
    return this.reviewService.startPracticeSession(req.user.sub, dto);
  }

  // 获取当前练习轮次状态
  @Get('session')
  async getPracticeSession(@Request() req: any) {
    const session = await this.reviewService.getPracticeSession(req.user.sub);
    return session;
  }

  // 提交练习答案
  @Post('session/:sessionId/submit')
  @HttpCode(HttpStatus.OK)
  async submitPracticeAnswer(
    @Request() req: any,
    @Param('sessionId') sessionId: string,
    @Body() dto: SubmitReviewDto,
  ) {
    return this.reviewService.submitPracticeAnswer(req.user.sub, sessionId, dto);
  }

  // 更新轮次状态（再来一轮/明日再来）
  @Post('session/:sessionId/status')
  @HttpCode(HttpStatus.OK)
  async updateSessionStatus(
    @Request() req: any,
    @Param('sessionId') sessionId: string,
    @Body('status') status: PracticeSessionStatus,
  ) {
    return this.reviewService.updateSessionStatus(req.user.sub, sessionId, status);
  }

  // 切换题目（上一题/下一题）
  @Post('session/:sessionId/navigate')
  @HttpCode(HttpStatus.OK)
  async navigateQuestion(
    @Request() req: any,
    @Param('sessionId') sessionId: string,
    @Body('direction') direction: 'prev' | 'next',
  ) {
    return this.reviewService.navigateQuestion(req.user.sub, sessionId, direction);
  }

  // 跳转到指定题目
  @Post('session/:sessionId/jump')
  @HttpCode(HttpStatus.OK)
  async jumpToQuestion(
    @Request() req: any,
    @Param('sessionId') sessionId: string,
    @Body('questionId') questionId: string,
  ) {
    return this.reviewService.jumpToQuestion(req.user.sub, sessionId, questionId);
  }

  // ============================================
  // 题目练习历史相关 API
  // ============================================

  // 获取单个题目的练习历史
  @Get('question/:questionId/history')
  async getQuestionPracticeHistory(
    @Request() req: any,
    @Param('questionId') questionId: string,
    @Query('page') page: string,
    @Query('pageSize') pageSize: string,
  ) {
    return this.reviewService.getQuestionPracticeHistory(
      req.user.sub,
      questionId,
      parseInt(page) || 1,
      parseInt(pageSize) || 20,
    );
  }

  // 获取单个题目的练习统计
  @Get('question/:questionId/stats')
  async getQuestionPracticeStats(
    @Request() req: any,
    @Param('questionId') questionId: string,
  ) {
    return this.reviewService.getQuestionPracticeStats(req.user.sub, questionId);
  }
}
