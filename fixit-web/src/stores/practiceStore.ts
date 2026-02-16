// stores/practiceStore.ts
// 练习状态管理（持久化）

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { Question } from '../api/question';
import { ReviewFilterParams } from '../api/review';

type PracticeMode = 'ebbinghaus' | 'random';

// 轮次状态
type RoundStatus = 'active' | 'completed' | 'tomorrow';

interface PracticeState {
  // 练习模式
  practiceMode: PracticeMode;

  // 题目列表
  questions: Question[];
  currentIndex: number;

  // 轮次状态
  roundStatus: RoundStatus;

  // 设置
  settings: ReviewFilterParams;

  // 操作
  setPracticeMode: (mode: PracticeMode) => void;
  setQuestions: (questions: Question[]) => void;
  setCurrentIndex: (index: number) => void;
  incrementCurrentIndex: () => void;
  decrementCurrentIndex: () => void;
  updateSettings: (settings: Partial<ReviewFilterParams>) => void;
  clearQuestions: () => void;
  setRoundCompleted: () => void;
  setRoundTomorrow: () => void;
  setRoundActive: () => void;
  resetRound: () => void;
}

export const usePracticeStore = create<PracticeState>()(
  devtools(
    persist(
      (set, get) => ({
        // 初始状态
        practiceMode: 'ebbinghaus',
        questions: [],
        currentIndex: 0,
        roundStatus: 'active',
        settings: {
          subjects: [],
          tags: [],
          minMasteryLevel: undefined,
          maxMasteryLevel: undefined,
        },

        // 设置练习模式
        setPracticeMode: (mode) => {
          set({ practiceMode: mode });
        },

        // 设置题目列表
        setQuestions: (questions) => {
          set({ questions, currentIndex: 0, roundStatus: 'active' });
        },

        // 设置当前题目索引
        setCurrentIndex: (index) => {
          set({ currentIndex: index });
        },

        // 增加当前索引（用于下一题）
        incrementCurrentIndex: () => {
          const { currentIndex, questions } = get();
          const nextIndex = currentIndex + 1;
          if (nextIndex >= questions.length) {
            // 最后一题完成，标记轮次完成
            set({ currentIndex: nextIndex, roundStatus: 'completed' });
          } else {
            set({ currentIndex: nextIndex });
          }
        },

        // 减少当前索引（用于上一题）
        decrementCurrentIndex: () => {
          const { currentIndex } = get();
          set({ currentIndex: Math.max(0, currentIndex - 1) });
        },

        // 更新设置
        updateSettings: (newSettings) => {
          set((state) => ({
            settings: { ...state.settings, ...newSettings },
          }));
        },

        // 清空题目
        clearQuestions: () => {
          set({ questions: [], currentIndex: 0, roundStatus: 'active' });
        },

        // 设置轮次为完成状态
        setRoundCompleted: () => {
          set({ roundStatus: 'completed' });
        },

        // 设置轮次为明日再来状态
        setRoundTomorrow: () => {
          set({ roundStatus: 'tomorrow' });
        },

        // 设置轮次为进行中状态
        setRoundActive: () => {
          set({ roundStatus: 'active' });
        },

        // 重置轮次（清空进度但保留题目）
        resetRound: () => {
          set({ currentIndex: 0, roundStatus: 'active' });
        },
      }),
      {
        name: 'practice-storage',
        partialize: (state) => ({
          practiceMode: state.practiceMode,
          questions: state.questions,
          currentIndex: state.currentIndex,
          roundStatus: state.roundStatus,
          settings: state.settings,
        }),
      }
    )
  )
);
