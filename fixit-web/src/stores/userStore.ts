import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi, User } from '../api/auth';

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
      partialize: (state) => ({ token: state.token, user: state.user, isLoggedIn: state.isLoggedIn }),
    },
  ),
);
