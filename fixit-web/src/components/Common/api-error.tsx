// components/Common/api-error.ts
// API 错误处理 Hook 和工具

import { message } from 'antd';
import { useCallback } from 'react';

// 错误类型
export interface ApiError {
  message: string;
  code?: string;
  status?: number;
}

// 错误处理配置
interface ErrorHandlerConfig {
  duration?: number; // Toast 显示时长
  showMessage?: boolean; // 是否显示 Toast
  onError?: (error: ApiError) => void; // 自定义错误处理
}

// 默认配置
const defaultConfig: ErrorHandlerConfig = {
  duration: 3,
  showMessage: true,
};

// API 错误处理工具函数
export const handleApiError = (error: unknown, config: ErrorHandlerConfig = defaultConfig): ApiError => {
  const finalConfig = { ...defaultConfig, ...config };

  let apiError: ApiError = {
    message: '操作失败，请稍后重试',
  };

  // Axios 错误
  if (error && typeof error === 'object' && 'response' in error) {
    const response = (error as { response?: { data?: { message?: string; msg?: string } } }).response;
    if (response?.data?.message) {
      apiError.message = response.data.message;
    } else if (response?.data?.msg) {
      apiError.message = response.data.msg;
    }
    apiError.status = (error as { response?: { status?: number } }).response?.status;
  }
  // Error 实例
  else if (error instanceof Error) {
    apiError.message = error.message;

    // 网络错误
    if (error.message.includes('Network Error')) {
      apiError.message = '网络连接失败，请检查网络设置';
    }
    // 超时错误
    else if (error.message.includes('timeout')) {
      apiError.message = '请求超时，请稍后重试';
    }
  }
  // 字符串错误
  else if (typeof error === 'string') {
    apiError.message = error;
  }

  // 显示 Toast
  if (finalConfig.showMessage) {
    message.error(apiError.message, finalConfig.duration);
  }

  // 自定义错误处理
  if (finalConfig.onError) {
    finalConfig.onError(apiError);
  }

  return apiError;
};

// API 成功处理
export const handleApiSuccess = (messageText: string = '操作成功', duration: number = 3) => {
  message.success(messageText, duration);
};

// Hook 版本的错误处理
export function useApiError() {
  const handleError = useCallback((error: unknown, config?: ErrorHandlerConfig) => {
    return handleApiError(error, config);
  }, []);

  const showSuccess = useCallback((messageText: string, duration?: number) => {
    message.success(messageText, duration);
  }, []);

  return {
    handleError,
    showSuccess,
  };
}

// Loading 包装器
export async function withLoading<T>(
  promise: Promise<T>,
  loadingMessage: string = '加载中...'
): Promise<T> {
  const hide = message.loading(loadingMessage, 0);
  try {
    return await promise;
  } finally {
    hide();
  }
}

// 错误边界 Fallback 组件
import { Result, Button } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';

interface ErrorFallbackProps {
  error?: Error;
  resetErrorBoundary?: () => void;
}

export function ErrorFallback({ error, resetErrorBoundary }: ErrorFallbackProps) {
  const handleReload = () => {
    if (confirm('确定要刷新页面吗？')) {
      window.location.reload();
    }
  };

  return (
    <Result
      status="error"
      title="页面出错了"
      subTitle={error?.message || '发生了未知错误'}
      extra={[
        <Button
          key="reload"
          type="primary"
          icon={<ReloadOutlined />}
          onClick={resetErrorBoundary || handleReload}
        >
          刷新页面
        </Button>,
      ]}
    />
  );
}
