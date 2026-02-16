import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import {
  SubmitReviewDto,
  ReviewStatus,
  ReviewStatsDto,
  TodayStatsDto,
  PracticeSessionStatus,
  PracticeSessionDto,
  StartPracticeDto,
  DailyPracticeStatusDto,
  PracticeRecordType,
  QuestionPracticeHistoryDto,
  QuestionPracticeStatsDto,
} from './dto/review.dto';

@Injectable()
export class ReviewService {
  constructor(private prisma: PrismaService) {}

  // Ebbinghaus间隔表（天）
  private readonly INTERVALS = [0, 1, 3, 7, 14, 30];

  // 获取待复习的题目（支持筛选）
  async getPendingReviews(
    userId: string,
    options: {
      limit?: number;
      subjects?: string[];
      tags?: string[];
      minMasteryLevel?: number;
      maxMasteryLevel?: number;
    } = {},
  ) {
    const now = new Date();
    const { limit = 10, subjects, tags, minMasteryLevel, maxMasteryLevel } = options;

    const where: any = {
      userId,
      OR: [
        { nextReviewAt: null }, // 还未开始复习
        { nextReviewAt: { lte: now } }, // 已到复习时间
      ],
    };

    // 学科多选筛选
    if (subjects && subjects.length > 0) {
      where.subject = { in: subjects };
    }

    // 掌握程度范围筛选
    if (minMasteryLevel !== undefined || maxMasteryLevel !== undefined) {
      where.masteryLevel = {};
      if (minMasteryLevel !== undefined) {
        where.masteryLevel.gte = minMasteryLevel;
      }
      if (maxMasteryLevel !== undefined) {
        where.masteryLevel.lte = maxMasteryLevel;
      }
    }

    // 标签多选筛选
    if (tags && tags.length > 0) {
      where.tags = {
        some: {
          tag: {
            name: { in: tags },
          },
        },
      };
    }

    return this.prisma.question.findMany({
      where,
      orderBy: [
        { nextReviewAt: 'asc' }, // 先复习早期的
        { createdAt: 'asc' }, // 再按创建时间
      ],
      take: limit,
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });
  }

  // 获取用户的复习历史
  async getReviewHistory(userId: string, page: number = 1, pageSize: number = 20) {
    const skip = (page - 1) * pageSize;

    const [logs, total] = await Promise.all([
      this.prisma.reviewLog.findMany({
        where: { question: { userId } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
        include: {
          question: {
            select: {
              id: true,
              content: true,
              subject: true,
              masteryLevel: true,
            },
          },
        },
      }),
      this.prisma.reviewLog.count({
        where: { question: { userId } },
      }),
    ]);

    return {
      data: logs,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  // 提交复习结果，计算下次复习时间
  async submitReview(userId: string, dto: SubmitReviewDto) {
    const question = await this.prisma.question.findUnique({
      where: { id: dto.questionId },
    });

    if (!question) {
      throw new NotFoundException('题目不存在');
    }

    if (question.userId !== userId) {
      throw new BadRequestException('无权操作此题目');
    }

    // 计算新的掌握程度和下次复习时间
    const { newLevel, days } = this.calculateNextReview(question.masteryLevel, dto.status);

    // 计算下次复习时间
    const nextReviewAt = new Date();
    nextReviewAt.setDate(nextReviewAt.getDate() + days);

    // 更新题目（增加练习次数）
    const updatedQuestion = await this.prisma.question.update({
      where: { id: dto.questionId },
      data: {
        masteryLevel: newLevel,
        nextReviewAt: nextReviewAt,
        lastReviewedAt: new Date(),
        practiceCount: { increment: 1 },
        totalTimeSpent: { increment: dto.duration || 0 },
      },
    });

    // 记录复习日志
    const reviewLog = await this.prisma.reviewLog.create({
      data: {
        questionId: dto.questionId,
        userId: question.userId,
        status: dto.status,
        note: dto.note,
        duration: dto.duration || 0,
      },
    });

    return {
      question: updatedQuestion,
      reviewLog,
      nextReviewAt,
      message: this.getReviewMessage(dto.status, newLevel),
    };
  }

  // Ebbinghaus算法：计算下次复习时间和掌握程度
  private calculateNextReview(
    currentLevel: number,
    status: ReviewStatus,
  ): { newLevel: number; days: number } {
    switch (status) {
      case ReviewStatus.FORGOTTEN:
        // 遗忘：降一级，明天复习
        return {
          newLevel: Math.max(0, currentLevel - 1),
          days: 1,
        };

      case ReviewStatus.FUZZY:
        // 模糊：保持当前等级，按当前间隔复习
        return {
          newLevel: currentLevel,
          days: this.INTERVALS[currentLevel] || 1,
        };

      case ReviewStatus.MASTERED:
        // 掌握：升一级，间隔翻倍
        return {
          newLevel: Math.min(5, currentLevel + 1),
          days: this.INTERVALS[Math.min(5, currentLevel + 1)] || 30,
        };
    }
  }

  // 获取复习提示信息
  private getReviewMessage(status: ReviewStatus, level: number): string {
    const labels = ['未学', '初学', '熟悉', '掌握', '精通', '专家'];
    const label = labels[level] || '未知';

    switch (status) {
      case ReviewStatus.FORGOTTEN:
        return `记住加强练习，下次复习已安排。掌握程度：${label}`;
      case ReviewStatus.FUZZY:
        return `继续保持，距离完全掌握还需努力。掌握程度：${label}`;
      case ReviewStatus.MASTERED:
        return `恭喜掌握该知识点！已延长复习间隔。掌握程度：${label}`;
    }
  }

  // 获取复习统计数据
  async getReviewStats(userId: string): Promise<ReviewStatsDto> {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

    const [totalQuestions, dueToday, thisWeekReviews, masteryDistribution] = await Promise.all([
      // 总题目数
      this.prisma.question.count({ where: { userId } }),

      // 今日待复习数
      this.prisma.question.count({
        where: {
          userId,
          OR: [
            { nextReviewAt: null },
            { nextReviewAt: { lte: now } },
          ],
        },
      }),

      // 本周复习次数
      this.prisma.reviewLog.count({
        where: {
          question: { userId },
          createdAt: { gte: startOfWeek },
        },
      }),

      // 掌握程度分布
      this.prisma.question.groupBy({
        by: ['masteryLevel'],
        where: { userId },
        _count: { masteryLevel: true },
      }),
    ]);

    return {
      totalQuestions,
      dueToday,
      thisWeekReviews,
      masteryDistribution: masteryDistribution.map((item) => ({
        level: item.masteryLevel,
        count: item._count.masteryLevel,
      })),
    };
  }

  // 获取今日待复习数量
  async getTodayReviewCount(userId: string): Promise<number> {
    const now = new Date();

    return this.prisma.question.count({
      where: {
        userId,
        OR: [
          { nextReviewAt: null },
          { nextReviewAt: { lte: now } },
        ],
      },
    });
  }

  // 获取学习热力图数据（过去365天）
  async getHeatmapData(userId: string) {
    const now = new Date();
    const oneYearAgo = new Date(now);
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const logs = await this.prisma.reviewLog.findMany({
      where: {
        question: { userId },
        createdAt: { gte: oneYearAgo },
      },
      select: {
        createdAt: true,
      },
    });

    // 按日期聚合
    const heatmapData: Record<string, number> = {};
    for (const log of logs) {
      const dateKey = log.createdAt.toISOString().split('T')[0];
      heatmapData[dateKey] = (heatmapData[dateKey] || 0) + 1;
    }

    // 转换为数组格式
    const result = Object.entries(heatmapData).map(([date, count]) => ({
      date,
      count,
      intensity: Math.min(4, Math.ceil(count / 3)),
    }));

    return result;
  }

  // 获取学习连续天数（streak）
  async getStreakData(userId: string) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // 获取所有复习日志，按日期分组
    const logs = await this.prisma.reviewLog.findMany({
      where: {
        question: { userId },
      },
      select: {
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (logs.length === 0) {
      return {
        currentStreak: 0,
        longestStreak: 0,
        lastReviewDate: null,
        totalDays: 0,
      };
    }

    // 获取复习日期集合
    const reviewDates = new Set<string>();
    for (const log of logs) {
      const dateKey = log.createdAt.toISOString().split('T')[0];
      reviewDates.add(dateKey);
    }

    // 计算连续天数
    let currentStreak = 0;
    let checkDate = new Date(today);

    while (reviewDates.has(checkDate.toISOString().split('T')[0])) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }

    // 检查昨天是否有记录（用于判断streak是否断裂）
    const yesterdayKey = yesterday.toISOString().split('T')[0];
    if (!reviewDates.has(yesterdayKey)) {
      // 昨天没复习，检查今天
      if (!reviewDates.has(today.toISOString().split('T')[0])) {
        currentStreak = 0;
      }
    }

    // 计算最长连续天数
    let longestStreak = 0;
    let tempStreak = 0;
    let tempDate = new Date(logs[logs.length - 1].createdAt);
    const endDate = new Date(today);

    // 标准化到当天开始
    tempDate = new Date(tempDate.getFullYear(), tempDate.getMonth(), tempDate.getDate());

    while (tempDate <= endDate) {
      const dateKey = tempDate.toISOString().split('T')[0];
      if (reviewDates.has(dateKey)) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 0;
      }
      tempDate.setDate(tempDate.getDate() + 1);
    }

    // 获取最后一次复习日期
    const lastReviewDate = logs[0].createdAt.toISOString().split('T')[0];

    return {
      currentStreak,
      longestStreak,
      lastReviewDate,
      totalDays: reviewDates.size,
    };
  }

  // 获取月度日历数据
  async getCalendarData(userId: string, year: number, month: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const logs = await this.prisma.reviewLog.findMany({
      where: {
        question: { userId },
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        createdAt: true,
        status: true,
      },
    });

    // 按日期聚合
    const calendarData: Record<string, { count: number; status: string }> = {};
    for (const log of logs) {
      const dateKey = log.createdAt.toISOString().split('T')[0];
      if (!calendarData[dateKey]) {
        calendarData[dateKey] = { count: 0, status: log.status };
      }
      calendarData[dateKey].count++;
    }

    return calendarData;
  }

  // 获取今日练习统计
  async getTodayStats(userId: string): Promise<TodayStatsDto> {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // 获取今日所有复习日志
    const todayLogs = await this.prisma.reviewLog.findMany({
      where: {
        question: { userId },
        createdAt: { gte: startOfDay },
      },
      select: {
        status: true,
      },
    });

    // 计算总数
    const totalCount = todayLogs.length;

    // 艾宾浩斯复习：统计今天复习的题目数量
    const ebbinghausCount = totalCount;

    // 随机复习：暂时无法区分，设为0
    const randomCount = 0;

    return {
      totalCount,
      ebbinghausCount,
      randomCount,
    };
  }

  // ============================================
  // 每日练习相关方法
  // ============================================

  // 获取每日练习状态
  async getDailyPracticeStatus(userId: string): Promise<DailyPracticeStatusDto> {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // 检查是否有进行中的 session
    const activeSession = await this.prisma.practiceSession.findFirst({
      where: {
        userId,
        status: PracticeSessionStatus.ACTIVE,
      },
      orderBy: { startedAt: 'desc' },
    });

    // 获取今日已完成的轮次数量
    const todayCompletedRounds = await this.prisma.practiceSession.count({
      where: {
        userId,
        status: PracticeSessionStatus.COMPLETED,
        completedAt: { gte: startOfDay },
      },
    });

    // 获取今日练习总数
    const todayTotalCount = await this.prisma.reviewLog.count({
      where: {
        question: { userId },
        createdAt: { gte: startOfDay },
      },
    });

    // 获取待复习数量
    const pendingCount = await this.getTodayReviewCount(userId);

    return {
      hasActiveSession: !!activeSession,
      activeSessionId: activeSession?.id,
      todayCompletedRounds,
      todayTotalCount,
      dailyLimit: activeSession?.dailyLimit || 20,
      pendingCount,
    };
  }

  // 完成今日练习
  async completeDailyPractice(userId: string): Promise<PracticeRecordType> {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // 获取今日所有复习日志的题目ID
    const todayLogs = await this.prisma.reviewLog.findMany({
      where: {
        question: { userId },
        createdAt: { gte: startOfDay },
      },
      select: { questionId: true },
    });

    const questionIds = [...new Set(todayLogs.map((log) => log.questionId))];
    const count = todayLogs.length;

    // 更新或创建 PracticeRecord
    const record = await this.prisma.practiceRecord.upsert({
      where: {
        userId_date: {
          userId,
          date: startOfDay,
        },
      },
      update: {
        questionIds,
        count,
        completed: true,
      },
      create: {
        userId,
        date: startOfDay,
        questionIds,
        count,
        completed: true,
      },
    });

    return record;
  }

  // 重置/再开一轮
  async resetDailyPractice(userId: string, dailyLimit?: number): Promise<PracticeSessionDto> {
    // 完成当前的练习（如果有）
    await this.prisma.practiceSession.updateMany({
      where: {
        userId,
        status: PracticeSessionStatus.ACTIVE,
      },
      data: {
        status: PracticeSessionStatus.COMPLETED,
        completedAt: new Date(),
      },
    });

    // 获取待复习题目
    const questions = await this.getPendingReviews(userId, { limit: dailyLimit || 20 });

    if (questions.length === 0) {
      throw new BadRequestException('暂没有待复习的题目');
    }

    // 随机打乱题目顺序
    const shuffledQuestions = [...questions].sort(() => Math.random() - 0.5);

    // 创建新的练习轮次
    const session = await this.prisma.practiceSession.create({
      data: {
        userId,
        dailyLimit: dailyLimit || 20,
        questionIds: shuffledQuestions.map((q) => q.id),
        currentIndex: 0,
        status: PracticeSessionStatus.ACTIVE,
      },
    });

    return {
      id: session.id,
      dailyLimit: session.dailyLimit,
      questions: shuffledQuestions as any,
      currentIndex: 0,
      status: session.status as PracticeSessionStatus,
      totalCount: shuffledQuestions.length,
      finishedCount: 0,
    };
  }

  // ============================================
  // 练习轮次相关方法
  // ============================================

  // 开始练习轮次（艾宾浩斯复习模式）
  async startPracticeSession(userId: string, dto: StartPracticeDto): Promise<PracticeSessionDto> {
    // 先完成或取消之前未完成的轮次
    await this.prisma.practiceSession.updateMany({
      where: {
        userId,
        status: PracticeSessionStatus.ACTIVE,
      },
      data: {
        status: PracticeSessionStatus.COMPLETED,
        completedAt: new Date(),
      },
    });

    const limit = dto.limit || 20;
    const params = {
      subjects: dto.subjects,
      tags: dto.tags,
      minMasteryLevel: dto.minMasteryLevel,
      maxMasteryLevel: dto.maxMasteryLevel,
    };

    // 艾宾浩斯模式：优先获取待复习的题目
    const pendingQuestions = await this.getPendingReviews(userId, { limit, ...params });

    let questions: any[];
    if (pendingQuestions.length > 0) {
      // 有待复习的题目，使用这些题目
      questions = pendingQuestions;
    } else {
      // 没有待复习的题目，获取所有题目（允许提前复习）
      const allQuestions = await this.prisma.question.findMany({
        where: {
          userId,
          ...(dto.subjects?.length ? { subject: { in: dto.subjects } } : {}),
          ...(dto.tags?.length ? { tags: { some: { tag: { name: { in: dto.tags } } } } } : {}),
          ...(dto.minMasteryLevel !== undefined ? { masteryLevel: { gte: dto.minMasteryLevel } } : {}),
          ...(dto.maxMasteryLevel !== undefined ? { masteryLevel: { lte: dto.maxMasteryLevel } } : {}),
        },
        orderBy: { nextReviewAt: 'asc' },
        take: limit,
        include: {
          tags: {
            include: { tag: true },
          },
        },
      });

      if (allQuestions.length > 0) {
        questions = allQuestions;
      } else {
        throw new BadRequestException('暂没有题目，请先录入一些错题');
      }
    }

    // 随机打乱题目顺序
    const shuffledQuestions = [...questions].sort(() => Math.random() - 0.5);

    // 创建练习轮次
    const session = await this.prisma.practiceSession.create({
      data: {
        userId,
        dailyLimit: limit,
        questionIds: shuffledQuestions.map((q) => q.id),
        currentIndex: 0,
        status: PracticeSessionStatus.ACTIVE,
      },
    });

    return {
      id: session.id,
      dailyLimit: session.dailyLimit,
      questions: shuffledQuestions.map((q) => ({
        ...q,
        analysis: q.analysis ?? undefined,
      })),
      currentIndex: 0,
      status: session.status as PracticeSessionStatus,
      totalCount: shuffledQuestions.length,
      finishedCount: 0,
    };
  }

  // 获取当前练习轮次状态
  async getPracticeSession(userId: string): Promise<PracticeSessionDto | null> {
    // 获取进行中的轮次
    const session = await this.prisma.practiceSession.findFirst({
      where: {
        userId,
        status: PracticeSessionStatus.ACTIVE,
      },
      orderBy: { startedAt: 'desc' },
    });

    if (!session) {
      return null;
    }

    // 获取题目详情
    const questions = await this.prisma.question.findMany({
      where: {
        id: { in: session.questionIds },
      },
      include: {
        tags: {
          include: { tag: true },
        },
      },
    });

    // 按 session.questionIds 的顺序重新排列
    const orderedQuestions = session.questionIds
      .map((id) => questions.find((q) => q.id === id))
      .filter(Boolean)
      .map((q) => ({
        ...q,
        analysis: q?.analysis ?? undefined,
      }));

    return {
      id: session.id,
      dailyLimit: session.dailyLimit,
      questions: orderedQuestions as any,
      currentIndex: session.currentIndex,
      status: session.status as PracticeSessionStatus,
      totalCount: session.questionIds.length,
      finishedCount: session.currentIndex,
    };
  }

  // 提交练习答案并进入下一题
  async submitPracticeAnswer(
    userId: string,
    sessionId: string,
    dto: SubmitReviewDto,
  ): Promise<{ session: PracticeSessionDto; isCompleted: boolean }> {
    const session = await this.prisma.practiceSession.findUnique({
      where: { id: sessionId },
    });

    if (!session || session.userId !== userId) {
      throw new NotFoundException('练习轮次不存在');
    }

    if (session.status !== PracticeSessionStatus.ACTIVE) {
      throw new BadRequestException('练习轮次已结束');
    }

    // 提交复习答案
    await this.submitReview(userId, dto);

    // 更新轮次状态
    const nextIndex = session.currentIndex + 1;
    const isCompleted = nextIndex >= session.questionIds.length;

    const updatedSession = await this.prisma.practiceSession.update({
      where: { id: sessionId },
      data: {
        currentIndex: nextIndex,
        ...(isCompleted
          ? { status: PracticeSessionStatus.COMPLETED, completedAt: new Date() }
          : {}),
      },
    });

    // 获取更新后的题目
    const questions = await this.prisma.question.findMany({
      where: {
        id: { in: updatedSession.questionIds },
      },
      include: {
        tags: {
          include: { tag: true },
        },
      },
    });

    const orderedQuestions = updatedSession.questionIds
      .map((id) => questions.find((q) => q.id === id))
      .filter((q): q is NonNullable<typeof q> => q != null)
      .map((q) => ({
        ...q,
        analysis: q.analysis ?? undefined,
      }));

    return {
      session: {
        id: updatedSession.id,
        dailyLimit: updatedSession.dailyLimit,
        questions: orderedQuestions as any,
        currentIndex: updatedSession.currentIndex,
        status: updatedSession.status as PracticeSessionStatus,
        totalCount: updatedSession.questionIds.length,
        finishedCount: updatedSession.currentIndex,
      },
      isCompleted,
    };
  }

  // 更新轮次状态（再来一轮）
  async updateSessionStatus(
    userId: string,
    sessionId: string,
    status: PracticeSessionStatus,
  ): Promise<PracticeSessionDto> {
    const session = await this.prisma.practiceSession.findUnique({
      where: { id: sessionId },
    });

    if (!session || session.userId !== userId) {
      throw new NotFoundException('练习轮次不存在');
    }

    const updatedSession = await this.prisma.practiceSession.update({
      where: { id: sessionId },
      data: {
        status,
        ...(status === PracticeSessionStatus.COMPLETED ? { completedAt: new Date() } : {}),
        ...(status === PracticeSessionStatus.TOMORROW ? { completedAt: new Date() } : {}),
      },
    });

    // 获取题目详情
    const questions = await this.prisma.question.findMany({
      where: {
        id: { in: updatedSession.questionIds },
      },
      include: {
        tags: {
          include: { tag: true },
        },
      },
    });

    const orderedQuestions = updatedSession.questionIds
      .map((id) => questions.find((q) => q.id === id))
      .filter((q): q is NonNullable<typeof q> => q != null)
      .map((q) => ({
        ...q,
        analysis: q.analysis ?? undefined,
      }));

    return {
      id: updatedSession.id,
      dailyLimit: updatedSession.dailyLimit,
      questions: orderedQuestions as any,
      currentIndex: updatedSession.currentIndex,
      status: updatedSession.status as PracticeSessionStatus,
      totalCount: updatedSession.questionIds.length,
      finishedCount: updatedSession.currentIndex,
    };
  }

  // 切换题目（上一题/下一题）
  async navigateQuestion(
    userId: string,
    sessionId: string,
    direction: 'prev' | 'next',
  ): Promise<PracticeSessionDto> {
    const session = await this.prisma.practiceSession.findUnique({
      where: { id: sessionId },
    });

    if (!session || session.userId !== userId) {
      throw new NotFoundException('练习轮次不存在');
    }

    if (session.status !== PracticeSessionStatus.ACTIVE) {
      throw new BadRequestException('练习轮次已结束');
    }

    let newIndex = session.currentIndex;
    if (direction === 'next') {
      newIndex = Math.min(session.currentIndex + 1, session.questionIds.length - 1);
    } else {
      newIndex = Math.max(session.currentIndex - 1, 0);
    }

    const updatedSession = await this.prisma.practiceSession.update({
      where: { id: sessionId },
      data: { currentIndex: newIndex },
    });

    // 获取题目详情
    const questions = await this.prisma.question.findMany({
      where: {
        id: { in: updatedSession.questionIds },
      },
      include: {
        tags: {
          include: { tag: true },
        },
      },
    });

    const orderedQuestions = updatedSession.questionIds
      .map((id) => questions.find((q) => q.id === id))
      .filter((q): q is NonNullable<typeof q> => q != null)
      .map((q) => ({
        ...q,
        analysis: q.analysis ?? undefined,
      }));

    return {
      id: updatedSession.id,
      dailyLimit: updatedSession.dailyLimit,
      questions: orderedQuestions as any,
      currentIndex: updatedSession.currentIndex,
      status: updatedSession.status as PracticeSessionStatus,
      totalCount: updatedSession.questionIds.length,
      finishedCount: updatedSession.currentIndex,
    };
  }

  // 直接跳转到指定题目
  async jumpToQuestion(
    userId: string,
    sessionId: string,
    questionId: string,
  ): Promise<PracticeSessionDto> {
    const session = await this.prisma.practiceSession.findUnique({
      where: { id: sessionId },
    });

    if (!session || session.userId !== userId) {
      throw new NotFoundException('练习轮次不存在');
    }

    if (session.status !== PracticeSessionStatus.ACTIVE) {
      throw new BadRequestException('练习轮次已结束');
    }

    const questionIndex = session.questionIds.findIndex((id) => id === questionId);
    if (questionIndex === -1) {
      throw new BadRequestException('题目不在当前轮次中');
    }

    const updatedSession = await this.prisma.practiceSession.update({
      where: { id: sessionId },
      data: { currentIndex: questionIndex },
    });

    // 获取题目详情
    const questions = await this.prisma.question.findMany({
      where: {
        id: { in: updatedSession.questionIds },
      },
      include: {
        tags: {
          include: { tag: true },
        },
      },
    });

    const orderedQuestions = updatedSession.questionIds
      .map((id) => questions.find((q) => q.id === id))
      .filter((q): q is NonNullable<typeof q> => q != null)
      .map((q) => ({
        ...q,
        analysis: q.analysis ?? undefined,
      }));

    return {
      id: updatedSession.id,
      dailyLimit: updatedSession.dailyLimit,
      questions: orderedQuestions as any,
      currentIndex: updatedSession.currentIndex,
      status: updatedSession.status as PracticeSessionStatus,
      totalCount: updatedSession.questionIds.length,
      finishedCount: updatedSession.currentIndex,
    };
  }

  // ============================================
  // 题目练习历史相关方法
  // ============================================

  // 获取单个题目的练习历史
  async getQuestionPracticeHistory(
    userId: string,
    questionId: string,
    page: number = 1,
    pageSize: number = 20,
  ): Promise<{ data: QuestionPracticeHistoryDto[]; total: number; totalPages: number }> {
    // 验证题目归属
    const question = await this.prisma.question.findUnique({
      where: { id: questionId },
    });

    if (!question) {
      throw new NotFoundException('题目不存在');
    }

    if (question.userId !== userId) {
      throw new BadRequestException('无权查看此题目');
    }

    const skip = (page - 1) * pageSize;

    const [logs, total] = await Promise.all([
      this.prisma.reviewLog.findMany({
        where: {
          questionId,
          userId,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
        select: {
          id: true,
          status: true,
          note: true,
          createdAt: true,
        },
      }),
      this.prisma.reviewLog.count({
        where: { questionId, userId },
      }),
    ]);

    return {
      data: logs.map((log) => ({
        id: log.id,
        status: log.status as ReviewStatus,
        note: log.note ?? undefined,
        createdAt: log.createdAt,
      })),
      total,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  // 获取单个题目的练习统计
  async getQuestionPracticeStats(
    userId: string,
    questionId: string,
  ): Promise<QuestionPracticeStatsDto> {
    // 验证题目归属
    const question = await this.prisma.question.findUnique({
      where: { id: questionId },
    });

    if (!question) {
      throw new NotFoundException('题目不存在');
    }

    if (question.userId !== userId) {
      throw new BadRequestException('无权查看此题目');
    }

    // 获取所有练习记录
    const logs = await this.prisma.reviewLog.findMany({
      where: {
        questionId,
        userId,
      },
      select: {
        status: true,
        duration: true,
        createdAt: true,
      },
    });

    // 统计各状态次数
    const statusCounts = {
      FORGOTTEN: 0,
      FUZZY: 0,
      MASTERED: 0,
    };

    let totalDuration = 0;
    let lastPracticedAt: Date | undefined;

    for (const log of logs) {
      const status = log.status as ReviewStatus;
      statusCounts[status]++;
      totalDuration += log.duration;
      if (!lastPracticedAt || log.createdAt > lastPracticedAt) {
        lastPracticedAt = log.createdAt;
      }
    }

    return {
      questionId,
      totalPracticeCount: logs.length,
      forgottenCount: statusCounts.FORGOTTEN,
      fuzzyCount: statusCounts.FUZZY,
      masteredCount: statusCounts.MASTERED,
      totalTimeSpent: totalDuration,
      averageDuration: logs.length > 0 ? Math.round(totalDuration / logs.length) : 0,
      lastPracticedAt,
    };
  }
}
