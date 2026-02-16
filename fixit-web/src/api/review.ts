import axios from './index';

export type ReviewStatus = 'FORGOTTEN' | 'FUZZY' | 'MASTERED';

export interface Question {
  id: string;
  content: string;
  answer: string;
  analysis?: string;
  images?: string[];
  subject: string;
  masteryLevel: number;
  practiceCount: number;  // 练习次数
  totalTimeSpent: number;  // 总练习时长（秒）
  createdAt: string;
  updatedAt: string;
  tags: { tag: { id: string; name: string } }[];
}

export interface ReviewLog {
  id: string;
  questionId: string;
  status: ReviewStatus;
  note?: string;
  createdAt: string;
  question?: Question;
}

export interface PendingReviewResponse {
  data: Question[];
  count: number;
}

export interface SubmitReviewParams {
  questionId: string;
  status: ReviewStatus;
  note?: string;
  duration?: number;  // 练习时长（秒）
}

export interface ReviewHistoryResponse {
  data: ReviewLog[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ReviewStats {
  totalQuestions: number;
  dueToday: number;
  thisWeekReviews: number;
  masteryDistribution: {
    level: number;
    count: number;
  }[];
}

export interface HeatmapData {
  date: string;
  count: number;
  intensity: number;
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastReviewDate: string | null;
  totalDays: number;
}

export interface CalendarData {
  [date: string]: {
    count: number;
    status: string;
  };
}

export interface ReviewFilterParams {
  limit?: number;
  subjects?: string[];
  tags?: string[];
  minMasteryLevel?: number;
  maxMasteryLevel?: number;
}

// 手动标记刷题参数
export interface ManualReviewParams {
  questionId: string;
  status: ReviewStatus;
  note?: string;
}

// 手动标记刷题响应
export interface ManualReviewResponse {
  message: string;
  data: {
    masteryLevel: number;
    nextReviewAt: string;
  };
}

// 今日练习统计
export interface TodayStats {
  totalCount: number;
  ebbinghausCount: number;
  randomCount: number;
}

// 每日练习状态
export interface DailyPracticeStatus {
  hasActiveSession: boolean;
  activeSessionId?: string;
  todayCompletedRounds: number;
  todayTotalCount: number;
  dailyLimit: number;
  pendingCount: number;
}

// 轮次状态
export type PracticeSessionStatus = 'ACTIVE' | 'COMPLETED' | 'TOMORROW';

// 练习轮次中的题目
export interface PracticeQuestion {
  id: string;
  content: string;
  answer: string;
  analysis?: string;
  images: string[];
  subject: string;
  masteryLevel: number;
  tags: { tag: { id: string; name: string } }[];
}

// 练习轮次响应
export interface PracticeSession {
  id: string;
  dailyLimit: number;
  questions: PracticeQuestion[];
  currentIndex: number;
  status: PracticeSessionStatus;
  totalCount: number;
  finishedCount: number;
}

// 开始练习参数
export interface StartPracticeParams {
  limit?: number;
  subjects?: string[];
  tags?: string[];
  minMasteryLevel?: number;
  maxMasteryLevel?: number;
}

// 更新轮次状态参数
export interface UpdateSessionStatusParams {
  status: PracticeSessionStatus;
}

// 切换题目参数
export interface NavigateQuestionParams {
  direction: 'prev' | 'next';
}

// 跳转到题目参数
export interface JumpToQuestionParams {
  questionId: string;
}

export const reviewApi = {
  // 获取待复习题目（支持筛选）
  getPending: (params?: ReviewFilterParams) =>
    axios.get<PendingReviewResponse>('/reviews/pending', { params }),

  // 提交复习结果
  submit: (params: SubmitReviewParams) =>
    axios.post('/reviews', params),

  // 手动标记刷题（从题库）
  manualReview: (params: ManualReviewParams) =>
    axios.post<ManualReviewResponse>('/reviews/manual', params),

  // 获取复习历史
  getHistory: (page?: number, pageSize?: number) =>
    axios.get<ReviewHistoryResponse>('/reviews/history', { params: { page, pageSize } }),

  // 获取复习统计
  getStats: () =>
    axios.get<ReviewStats>('/reviews/stats'),

  // 获取今日待复习数量
  getTodayCount: () =>
    axios.get<{ count: number }>('/reviews/today-count'),

  // 获取热力图数据
  getHeatmap: () =>
    axios.get<HeatmapData[]>('/reviews/heatmap'),

  // 获取连续学习数据
  getStreak: () =>
    axios.get<StreakData>('/reviews/streak'),

  // 获取月度日历数据
  getCalendar: (year: number, month: number) =>
    axios.get<CalendarData>('/reviews/calendar', { params: { year, month } }),

  // 获取状态选项
  getStatusOptions: () =>
    axios.get<{ label: string; value: ReviewStatus }[]>('/reviews/status-options'),

  // 获取今日练习统计
  getTodayStats: () =>
    axios.get<TodayStats>('/reviews/today-stats'),

  // ========== 每日练习相关 API ==========

  // 获取每日练习状态
  getDailyStatus: () =>
    axios.get<DailyPracticeStatus>('/reviews/daily-status'),

  // 完成今日练习
  completeDailyPractice: () =>
    axios.post('/reviews/daily/finish'),

  // 重置/再开一轮
  resetDailyPractice: (dailyLimit?: number) =>
    axios.post('/reviews/daily/reset', { dailyLimit }),

  // ========== 练习轮次相关 API ==========

  // 开始练习轮次
  startPracticeSession: (params: StartPracticeParams) =>
    axios.post<PracticeSession>('/reviews/session/start', params),

  // 获取当前练习轮次状态
  getPracticeSession: () =>
    axios.get<PracticeSession | null>('/reviews/session'),

  // 提交练习答案
  submitPracticeAnswer: (sessionId: string, params: SubmitReviewParams) =>
    axios.post<{ session: PracticeSession; isCompleted: boolean }>(
      `/reviews/session/${sessionId}/submit`,
      params
    ),

  // 更新轮次状态（再来一轮/明日再来）
  updateSessionStatus: (sessionId: string, status: PracticeSessionStatus) =>
    axios.post<PracticeSession>(
      `/reviews/session/${sessionId}/status`,
      { status }
    ),

  // 切换题目（上一题/下一题）
  navigateQuestion: (sessionId: string, direction: 'prev' | 'next') =>
    axios.post<PracticeSession>(
      `/reviews/session/${sessionId}/navigate`,
      { direction }
    ),

  // 跳转到指定题目
  jumpToQuestion: (sessionId: string, questionId: string) =>
    axios.post<PracticeSession>(
      `/reviews/session/${sessionId}/jump`,
      { questionId }
    ),

  // ========== 题目练习历史相关 API ==========

  // 获取单个题目的练习历史
  getQuestionPracticeHistory: (questionId: string, page?: number, pageSize?: number) =>
    axios.get<{
      data: QuestionPracticeHistoryItem[];
      total: number;
      totalPages: number;
    }>(`/reviews/question/${questionId}/history`, { params: { page, pageSize } }),

  // 获取单个题目的练习统计
  getQuestionPracticeStats: (questionId: string) =>
    axios.get<QuestionPracticeStats>(`/reviews/question/${questionId}/stats`),
};

// 单个题目的练习历史项
export interface QuestionPracticeHistoryItem {
  id: string;
  status: ReviewStatus;
  note?: string;
  createdAt: string;
}

// 单个题目的练习统计
export interface QuestionPracticeStats {
  questionId: string;
  totalPracticeCount: number;  // 总练习次数
  forgottenCount: number;       // 没做对次数
  fuzzyCount: number;         // 模糊次数
  masteredCount: number;       // 完全掌握次数
  totalTimeSpent: number;      // 总练习时长（秒）
  averageDuration: number;      // 平均每次练习时长（秒）
  lastPracticedAt?: string;    // 最近练习时间
}
