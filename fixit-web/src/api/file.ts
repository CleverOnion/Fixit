import axios from './index';

export const fileApi = {
  upload: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return axios.post<{ url: string; key: string }>('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  delete: (key: string) =>
    axios.delete(`/files/${key}`),
};
