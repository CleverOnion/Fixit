import axios from './index';

export interface Tag {
  id: string;
  name: string;
  category: string;
  color: string;
  createdAt: string;
}

export interface CreateTagParams {
  name: string;
  category?: string;
  color?: string;
}

export interface UpdateTagParams {
  name?: string;
  category?: string;
  color?: string;
}

export const tagApi = {
  // 获取所有标签
  list: (category?: string) =>
    axios.get<Tag[]>('/tags', { params: { category } }),

  // 获取标签分类
  getCategories: () =>
    axios.get<string[]>('/tags/categories'),

  // 获取单个标签
  get: (id: string) =>
    axios.get<Tag>(`/tags/${id}`),

  // 创建标签
  create: (params: CreateTagParams) =>
    axios.post<Tag>('/tags', params),

  // 更新标签
  update: (id: string, params: UpdateTagParams) =>
    axios.put<Tag>(`/tags/${id}`, params),

  // 删除标签
  delete: (id: string) =>
    axios.delete(`/tags/${id}`),
};
