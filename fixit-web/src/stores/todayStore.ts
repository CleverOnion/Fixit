// stores/todayStore.ts
// 今日统计数据管理 - 集中管理避免重复请求

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { reviewApi } from '../api/review';

interface TodayState {
  count: number;
  loading: boolean;
  error: string | null;
  fetchTodayCount: () => Promise<void>;
  clearTodayCount: () => void;
}

export const useTodayStore = create<TodayState>()(
  devtools(
    (set, get) => ({
      count: 0,
      loading: false,
      error: null,

      fetchTodayCount: async () => {
        const { loading } = get();

        // 防止重复请求
        if (loading) return;

        set({ loading: true, error: null });

        try {
          const res = await reviewApi.getTodayCount();
          set({ count: res.data.count, loading: false });
        } catch (error) {
          set({
            count: 0,
            loading: false,
            error: error instanceof Error ? error.message : '获取今日统计失败'
          });
        }
      },

      clearTodayCount: () => {
        set({ count: 0, error: null });
      },
    }),
    { name: 'today-store' }
  )
);
