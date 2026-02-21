import axios from './index';

export interface Question {
  id: string;
  content: string;
  answer: string;
  analysis?: string;
  remark?: string;
  images?: string[];
  subject: string;
  masteryLevel: number;
  practiceCount: number;  // 练习次数
  totalTimeSpent: number;  // 总练习时长（秒）
  createdAt: string;
  updatedAt: string;
  tags: { tag: { id: string; name: string } }[];
}

export interface CreateQuestionParams {
  content: string;
  answer: string;
  analysis?: string;
  remark?: string;
  images?: string[];
  subject: string;
  tags?: string[];
}

export interface UpdateQuestionParams {
  content?: string;
  answer?: string;
  analysis?: string;
  remark?: string;
  images?: string[];
  subject?: string;
  masteryLevel?: number;
  tags?: string[];
}

export interface QuestionListParams {
  subject?: string;
  tag?: string;
  masteryLevel?: number;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface QuestionListResponse {
  data: Question[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// 练习模式筛选参数
export interface PracticeFilterParams {
  subjects?: string[];
  tags?: string[];
  minMasteryLevel?: number;
  maxMasteryLevel?: number;
  limit?: number;
  orderBy?: 'asc' | 'desc';
}

// 导出题目数据格式
export interface ExportedQuestion {
  content: string;
  answer: string;
  analysis?: string;
  remark?: string;
  images: string[];
  subject: string;
  tags: string[];
  masteryLevel?: number;
  nextReviewAt?: string;
  lastReviewedAt?: string;
}

export interface ExportData {
  version: string;
  exportedAt: string;
  totalQuestions: number;
  includeMeta: boolean;
  questions: ExportedQuestion[];
}

export interface ImportResult {
  success: number;
  skipped: number;
  errors: string[];
}

export const questionApi = {
  // 创建题目
  create: (params: CreateQuestionParams) =>
    axios.post<Question>('/questions', params),

  // 获取题目列表
  list: (params?: QuestionListParams) =>
    axios.get<QuestionListResponse>('/questions', { params }),

  // 获取题目详情
  get: (id: string) =>
    axios.get<Question>(`/questions/${id}`),

  // 更新题目
  update: (id: string, params: UpdateQuestionParams) =>
    axios.put<Question>(`/questions/${id}`, params),

  // 删除题目
  delete: (id: string) =>
    axios.delete(`/questions/${id}`),

  // 获取学科列表
  getSubjects: (search?: string) =>
    axios.get<string[]>('/questions/subjects', { params: { search } }),

  // 顺序刷题
  getSequential: (params?: PracticeFilterParams) =>
    axios.get<{ data: Question[]; count: number }>('/questions/sequential', { params }),

  // 随机练习
  getRandom: (params?: PracticeFilterParams) =>
    axios.get<{ data: Question[]; count: number }>('/questions/random', { params }),

  // 专项训练
  getBySubject: (params?: PracticeFilterParams) =>
    axios.get<{ data: Question[]; count: number }>('/questions/by-subject', { params }),

  // 导出题目
  export: (includeMeta: boolean = false) => {
    const url = `/questions/export?includeMeta=${includeMeta}`;
    return axios.get<Blob>(url, { responseType: 'blob' });
  },

  // 导入题目
  import: (data: ExportData, includeMeta: boolean) =>
    axios.post<ImportResult>('/questions/import', { data, includeMeta }),

  // 随机抽题（返回题目ID列表）
  randomPick: (params?: PracticeFilterParams) =>
    axios.post<{ questionIds: string[] }>('/questions/random', params),
};
