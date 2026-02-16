import axios from './index';

export interface RecognizeQuestionResponse {
  content: string;
  answer?: string;
  analysis?: string;
}

export const aiApi = {
  // 从图片识别题目、答案和解析
  recognizeQuestion: (params: { images: string[]; instruction?: string }) =>
    axios.post<RecognizeQuestionResponse>('/ai/recognize-question', params),

  // 生成答案
  generateAnswer: (params: { question: string; instruction?: string }) =>
    axios.post<{ answer: string }>('/ai/generate-answer', params),

  // 生成解析
  generateAnalysis: (params: { question: string; answer?: string; instruction?: string }) =>
    axios.post<{ analysis: string }>('/ai/generate-analysis', params),
};
