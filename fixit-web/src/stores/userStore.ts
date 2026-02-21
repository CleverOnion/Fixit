import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi, User } from '../api/auth';

// Storage 版本控制
const STORAGE_VERSION = 1;

// 旧版本数据迁移
const migratePersistedState = (persistedState: unknown, version: number) => {
  const state = persistedState as Partial<UserState>;
  if (version === 0) {
    // 从 v0 迁移到 v1
    // 示例: 重命名字段、转换数据格式等
    return {
      ...state,
      // 添加新字段或转换旧字段
    };
  }
  return state;
};

interface UserState {
  user: User | null;
  token: string | null;
  isLoggedIn: boolean;
  setUser: (user: User) => void;
  setToken: (token: string) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, nickname: string, invitationCode: string) => Promise<void>;
  logout: () => void;
  fetchProfile: () => Promise<void>;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoggedIn: false,

      setUser: (user) => set({ user, isLoggedIn: true }),
      setToken: (token) => {
        localStorage.setItem('token', token);
        set({ token });
      },

      login: async (email, password) => {
        const response = await authApi.login({ email, password });
        const { user, token } = response.data;
        localStorage.setItem('token', token);
        set({ user, token, isLoggedIn: true });
      },

      register: async (email, password, nickname, invitationCode) => {
        const response = await authApi.register({ email, password, nickname, invitationCode });
        const { user, token } = response.data;
        localStorage.setItem('token', token);
        set({ user, token, isLoggedIn: true });
      },

      logout: () => {
        localStorage.removeItem('token');
        set({ user: null, token: null, isLoggedIn: false });
      },

      fetchProfile: async () => {
        const token = get().token;
        if (!token) return;
        try {
          const response = await authApi.getProfile();
          set({ user: response.data, isLoggedIn: true });
        } catch {
          get().logout();
        }
      },
    }),
    {
      name: 'user-storage',
      version: STORAGE_VERSION,
      partialize: (state) => ({ token: state.token, user: state.user, isLoggedIn: state.isLoggedIn }),
      migrate: migratePersistedState,
    },
  ),
);
