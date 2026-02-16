// stores/questionStore.ts
// 题目状态管理

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { questionApi, Question, CreateQuestionParams, UpdateQuestionParams, QuestionListParams } from '../api/question';

interface QuestionState {
  // 状态
  questions: Question[];
  currentQuestion: Question | null;
  loading: boolean;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  };
  filters: QuestionListParams;

  // 操作
  fetchQuestions: (filters?: QuestionListParams) => Promise<void>;
  getQuestion: (id: string) => Promise<Question | null>;
  createQuestion: (data: CreateQuestionParams) => Promise<void>;
  updateQuestion: (id: string, data: UpdateQuestionParams) => Promise<void>;
  deleteQuestion: (id: string) => Promise<void>;
  clearCurrentQuestion: () => void;
  setFilters: (filters: QuestionListParams) => void;
  setPage: (page: number) => void;
  setQuestions: (questions: Question[]) => void;
}

export const useQuestionStore = create<QuestionState>()(
  devtools(
    persist(
      (set, get) => ({
        // 初始状态
        questions: [],
        currentQuestion: null,
        loading: false,
        pagination: {
          page: 1,
          pageSize: 10,
          total: 0,
        },
        filters: {},

        // 获取题目列表
        fetchQuestions: async (filters) => {
          set({ loading: true });
          try {
            const { pagination, filters: currentFilters } = get();
            const params = {
              ...currentFilters,
              ...filters,
              page: filters?.page || pagination.page,
              pageSize: filters?.pageSize || pagination.pageSize,
            };
            const res = await questionApi.list(params);
            set({
              questions: res.data.data,
              pagination: {
                page: res.data.page,
                pageSize: res.data.pageSize,
                total: res.data.total,
              },
              filters: params,
            });
          } catch (error) {
            console.error('获取题目列表失败', error);
            throw error;
          } finally {
            set({ loading: false });
          }
        },

        // 获取单个题目
        getQuestion: async (id) => {
          set({ loading: true });
          try {
            const res = await questionApi.get(id);
            const question = res.data;
            set({ currentQuestion: question });
            return question;
          } catch (error) {
            console.error('获取题目失败', error);
            return null;
          } finally {
            set({ loading: false });
          }
        },

        // 创建题目
        createQuestion: async (data) => {
          set({ loading: true });
          try {
            await questionApi.create(data);
            // 刷新列表
            await get().fetchQuestions();
          } finally {
            set({ loading: false });
          }
        },

        // 更新题目
        updateQuestion: async (id, data) => {
          set({ loading: true });
          try {
            await questionApi.update(id, data);
            // 如果当前有题目，更新它
            const current = get().currentQuestion;
            if (current && current.id === id) {
              set({
                currentQuestion: { ...current, ...data } as Question,
              });
            }
            // 刷新列表
            await get().fetchQuestions();
          } finally {
            set({ loading: false });
          }
        },

        // 删除题目
        deleteQuestion: async (id) => {
          set({ loading: true });
          try {
            await questionApi.delete(id);
            set({
              questions: get().questions.filter((q) => q.id !== id),
              pagination: {
                ...get().pagination,
                total: get().pagination.total - 1,
              },
            });
          } finally {
            set({ loading: false });
          }
        },

        // 清空当前题目
        clearCurrentQuestion: () => {
          set({ currentQuestion: null });
        },

        // 设置筛选条件
        setFilters: (filters) => {
          set({ filters, pagination: { ...get().pagination, page: 1 } });
        },

        // 设置页码
        setPage: (page) => {
          set({ pagination: { ...get().pagination, page } });
        },

        // 直接设置题目列表（用于首页加载）
        setQuestions: (questions) => {
          set({ questions });
        },
      }),
      {
        name: 'question-storage',
        partialize: (state) => ({
          pagination: state.pagination,
          filters: state.filters,
        }),
      }
    )
  )
);
