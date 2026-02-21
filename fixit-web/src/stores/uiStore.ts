// stores/uiStore.ts
// 全局 UI 状态管理

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

// Storage 版本控制
const STORAGE_VERSION = 1;

interface UIState {
  // 侧边栏状态
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;

  // 主题 (day: 白天模式, night: 黑夜模式)
  theme: 'day' | 'night';
  setTheme: (theme: 'day' | 'night') => void;

  // 加载状态
  globalLoading: boolean;
  setGlobalLoading: (loading: boolean) => void;

  // Toast 配置
  toastDuration: number;
  setToastDuration: (duration: number) => void;

  // 动画
  animationEnabled: boolean;
  setAnimationEnabled: (enabled: boolean) => void;
}

export const useUIStore = create<UIState>()(
  devtools(
    persist(
      (set, get) => ({
        // 侧边栏状态
        sidebarCollapsed: false,
        toggleSidebar: () => {
          set({ sidebarCollapsed: !get().sidebarCollapsed });
        },
        setSidebarCollapsed: (collapsed) => {
          set({ sidebarCollapsed: collapsed });
        },

        // 主题
        theme: 'night',
        setTheme: (theme) => {
          set({ theme });
          // 应用主题
          document.documentElement.setAttribute('data-theme', theme);
        },

        // 全局加载
        globalLoading: false,
        setGlobalLoading: (loading) => {
          set({ globalLoading: loading });
        },

        // Toast 持续时间
        toastDuration: 3,
        setToastDuration: (duration) => {
          set({ toastDuration: duration });
        },

        // 动画开关
        animationEnabled: true,
        setAnimationEnabled: (enabled) => {
          set({ animationEnabled: enabled });
        },
      }),
      {
        name: 'ui-storage',
        version: STORAGE_VERSION,
        partialize: (state) => ({
          sidebarCollapsed: state.sidebarCollapsed,
          theme: state.theme,
          toastDuration: state.toastDuration,
          animationEnabled: state.animationEnabled,
        }),
      }
    )
  )
);
