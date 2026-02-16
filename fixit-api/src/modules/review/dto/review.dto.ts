import { IsString, IsOptional, IsNumber, IsUUID, IsArray, IsBoolean, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';

export enum ReviewStatus {
  FORGOTTEN = 'FORGOTTEN',
  FUZZY = 'FUZZY',
  MASTERED = 'MASTERED',
}

// 练习轮次状态
export enum PracticeSessionStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  TOMORROW = 'TOMORROW',
}

export class SubmitReviewDto {
  @IsUUID()
  questionId: string;

  @IsEnum(ReviewStatus)
  status: ReviewStatus;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsNumber()
  duration?: number;  // 练习耗时（秒）
}

export class ReviewFilterDto {
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => Number(value))
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => Number(value))
  pageSize?: number = 20;

  @IsOptional()
  @IsEnum(ReviewStatus)
  status?: ReviewStatus;
}

export class ReviewResponseDto {
  id: string;
  questionId: string;
  status: ReviewStatus;
  note?: string;
  createdAt: Date;
  question?: {
    id: string;
    content: string;
    answer: string;
    subject: string;
    masteryLevel: number;
  };
}

export class PendingReviewDto {
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => Number(value))
  limit?: number = 10;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').filter(Boolean);
    }
    return value;
  })
  subjects?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').filter(Boolean);
    }
    return value;
  })
  tags?: string[];

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => Number(value))
  minMasteryLevel?: number;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => Number(value))
  maxMasteryLevel?: number;
}

export class ReviewStatsDto {
  totalQuestions: number;
  dueToday: number;
  masteryDistribution: {
    level: number;
    count: number;
  }[];
  thisWeekReviews: number;
}

// 手动标记刷题 DTO
export class ManualReviewDto {
  @IsUUID()
  questionId: string;

  @IsEnum(ReviewStatus)
  status: ReviewStatus;

  @IsOptional()
  @IsString()
  note?: string;
}

// 今日练习统计 DTO
export class TodayStatsDto {
  totalCount: number;
  ebbinghausCount: number;
  randomCount: number;
}

// 每日练习状态 DTO
export class DailyPracticeStatusDto {
  hasActiveSession: boolean;
  activeSessionId?: string;
  todayCompletedRounds: number;  // 今日已完成轮次
  todayTotalCount: number;       // 今日练习总数
  dailyLimit: number;            // 每轮任务量
  pendingCount: number;          // 待复习数量
}

// 每日练习完成 DTO
export class CompleteDailyPracticeDto {
  @IsOptional()
  @IsBoolean()
  completed?: boolean = true;
}

// 随机抽题参数 DTO
export class RandomPickDto {
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => Number(value))
  limit?: number = 20;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  subjects?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsNumber()
  minMasteryLevel?: number;

  @IsOptional()
  @IsNumber()
  maxMasteryLevel?: number;
}

// 开始练习轮次 DTO
export class StartPracticeDto {
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => Number(value))
  limit?: number = 20;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  subjects?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsNumber()
  minMasteryLevel?: number;

  @IsOptional()
  @IsNumber()
  maxMasteryLevel?: number;
}

// 练习轮次响应 DTO
export class PracticeSessionDto {
  id: string;
  dailyLimit: number;
  questions: {
    id: string;
    content: string;
    answer: string;
    analysis?: string;
    images: string[];
    subject: string;
    masteryLevel: number;
    tags: { tag: { id: string; name: string } }[];
  }[];
  currentIndex: number;
  status: PracticeSessionStatus;
  totalCount: number;
  finishedCount: number;
}

// 切换轮次状态 DTO
export class UpdateSessionStatusDto {
  @IsEnum(PracticeSessionStatus)
  status: PracticeSessionStatus;
}

// 练习记录类型
export type PracticeRecordType = {
  id: string;
  userId: string;
  date: Date;
  questionIds: string[];
  count: number;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
};

// 单个题目的练习历史
export class QuestionPracticeHistoryDto {
  id: string;
  status: ReviewStatus;
  note?: string;
  createdAt: Date;
}

// 题目练习统计
export class QuestionPracticeStatsDto {
  questionId: string;
  totalPracticeCount: number;  // 总练习次数
  forgottenCount: number;      // 没做对次数
  fuzzyCount: number;          // 模糊次数
  masteredCount: number;       // 完全掌握次数
  totalTimeSpent: number;      // 总练习时长（秒）
  averageDuration: number;      // 平均每次练习时长（秒）
  lastPracticedAt?: Date;      // 最近练习时间
}
