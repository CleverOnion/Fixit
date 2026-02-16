// stores/statsStore.ts
// 今日统计状态管理（持久化，跨模式统计）

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type PracticeMode = 'ebbinghaus' | 'random';

export interface TodayStats {
  date: string;                    // 2025-01-15
  totalCount: number;               // 今日总刷题数
  ebbinghausCount: number;         // 艾宾浩斯刷题数
  randomCount: number;              // 随机复习刷题数
}

interface StatsState {
  stats: TodayStats;

  // Actions
  incrementCount: (mode: PracticeMode) => void;
  getStats: () => TodayStats;
  resetIfNewDay: () => void;
  clear: () => void;
}

// 获取今天的日期字符串 (YYYY-MM-DD)
const getTodayDateStr = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const useStatsStore = create<StatsState>()(
  persist(
    (set, get) => ({
      stats: {
        date: getTodayDateStr(),
        totalCount: 0,
        ebbinghausCount: 0,
        randomCount: 0,
      },

      // 增加计数
      incrementCount: (mode: PracticeMode) => {
        set((state) => {
          // 如果是新的一天，先重置
          const today = getTodayDateStr();
          if (state.stats.date !== today) {
            return {
              stats: {
                date: today,
                totalCount: 1,
                ebbinghausCount: mode === 'ebbinghaus' ? 1 : 0,
                randomCount: mode === 'random' ? 1 : 0,
              },
            };
          }

          // 正常增加计数
          return {
            stats: {
              ...state.stats,
              totalCount: state.stats.totalCount + 1,
              ebbinghausCount: mode === 'ebbinghaus'
                ? state.stats.ebbinghausCount + 1
                : state.stats.ebbinghausCount,
              randomCount: mode === 'random'
                ? state.stats.randomCount + 1
                : state.stats.randomCount,
            },
          };
        });
      },

      // 获取当前统计
      getStats: () => {
        const state = get();
        const today = getTodayDateStr();

        // 如果是新的一天，返回空的今日统计
        if (state.stats.date !== today) {
          return {
            date: today,
            totalCount: 0,
            ebbinghausCount: 0,
            randomCount: 0,
          };
        }

        return state.stats;
      },

      // 检查是否是新的一天，如果是则重置
      resetIfNewDay: () => {
        const today = getTodayDateStr();
        set((state) => {
          if (state.stats.date !== today) {
            return {
              stats: {
                date: today,
                totalCount: 0,
                ebbinghausCount: 0,
                randomCount: 0,
              },
            };
          }
          return state;
        });
      },

      // 清空统计
      clear: () => {
        set({
          stats: {
            date: getTodayDateStr(),
            totalCount: 0,
            ebbinghausCount: 0,
            randomCount: 0,
          },
        });
      },
    }),
    {
      name: 'today-stats-storage',
    }
  )
);
