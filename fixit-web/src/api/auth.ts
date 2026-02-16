import api from './index';

export interface User {
  id: string;
  email: string;
  nickname: string;
  avatar?: string;
  createdAt: string;
}

export interface LoginParams {
  email: string;
  password: string;
}

export interface RegisterParams {
  email: string;
  password: string;
  nickname: string;
  invitationCode: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export const authApi = {
  login: (params: LoginParams) =>
    api.post<AuthResponse>('/auth/login', params),

  register: (params: RegisterParams) =>
    api.post<AuthResponse>('/auth/register', params),

  getProfile: () =>
    api.get<User>('/auth/profile'),

  updateProfile: (data: { nickname?: string; avatar?: string }) =>
    api.put<User>('/auth/profile', data),
};
