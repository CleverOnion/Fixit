// components/Common/ErrorBoundary.tsx
// React 错误边界组件

import { Component, ErrorInfo, ReactNode } from 'react';
import { Button, Card, Result } from 'antd';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by ErrorBoundary:', error);
    console.error('Component stack:', errorInfo.componentStack);
  }

  private handleReload = () => {
    if (confirm('确定要刷新页面吗？未保存的数据可能会丢失。')) {
      window.location.reload();
    }
  };

  private handleGoHome = () => {
    if (confirm('确定要返回首页吗？')) {
      window.location.href = '/';
    }
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            padding: 24,
          }}
        >
          <Card style={{ maxWidth: 500, textAlign: 'center' }}>
            <Result
              status="error"
              title="页面出现错误"
              subTitle="很抱歉，页面遇到了意外错误。请尝试刷新页面或返回首页。"
              extra={[
                <Button type="primary" key="reload" onClick={this.handleReload}>
                  刷新页面
                </Button>,
                <Button key="home" onClick={this.handleGoHome}>
                  返回首页
                </Button>,
              ]}
            />
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// API 错误处理工具
export const handleApiError = (error: unknown, fallbackMessage?: string): string => {
  if (error instanceof Error) {
    // Axios 错误
    if ('response' in error) {
      const response = (error as { response?: { data?: { message?: string } } }).response;
      if (response?.data?.message) {
        return response.data.message;
      }
    }

    // 网络错误
    if (error.message.includes('Network Error')) {
      return '网络连接失败，请检查网络设置';
    }

    // 超时错误
    if (error.message.includes('timeout')) {
      return '请求超时，请稍后重试';
    }

    return error.message;
  }

  return fallbackMessage || '操作失败，请稍后重试';
};

// 全局错误处理器
export const setupErrorHandlers = () => {
  // 未捕获的 Promise 错误
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled Promise Rejection:', event.reason);
    event.preventDefault();
  });

  // 未捕获的脚本错误
  window.addEventListener('error', (event) => {
    console.error('Global Error:', event.error);
  });
};
