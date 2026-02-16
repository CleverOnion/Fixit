import api from './index';

export interface InvitationCode {
  id: string;
  code: string;
  createdBy: string | null;
  usedBy: string | null;
  usedAt: string | null;
  createdAt: string;
}

export interface CreateInvitationParams {
  code?: string;
}

export const invitationApi = {
  // 创建邀请码
  create: (params?: CreateInvitationParams) =>
    api.post<InvitationCode>('/invitations', params),

  // 获取当前用户创建的所有邀请码
  list: () =>
    api.get<InvitationCode[]>('/invitations'),

  // 删除邀请码
  delete: (id: string) =>
    api.delete<{ success: boolean }>(`/invitations/${id}`),
};
