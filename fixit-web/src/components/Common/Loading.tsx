// components/Common/Loading.tsx
// 统一加载状态组件

import { Spin, SpinProps } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

interface LoadingProps extends Omit<SpinProps, 'indicator'> {
  tip?: string;
  size?: 'small' | 'default' | 'large';
  fullScreen?: boolean;
}

export function Loading({ tip = '加载中...', size = 'default', fullScreen = false, ...props }: LoadingProps) {
  const spinIndicator = <LoadingOutlined style={{ fontSize: size === 'large' ? 32 : size === 'small' ? 16 : 24 }} spin />;

  if (fullScreen) {
    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(255, 255, 255, 0.9)',
          zIndex: 9999,
        }}
      >
        <Spin indicator={spinIndicator} size={size} {...props} />
        {tip && <div style={{ marginTop: 8, color: '#666' }}>{tip}</div>}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 48 }}>
      <Spin indicator={spinIndicator} size={size} {...props} />
      {tip && <div style={{ marginTop: 8, color: '#666' }}>{tip}</div>}
    </div>
  );
}

// 全屏加载 Hook
import { useState, useCallback } from 'react';

export function useFullScreenLoading() {
  const [loading, setLoading] = useState(false);
  const [tip, setTip] = useState('加载中...');

  const show = useCallback((message?: string) => {
    setTip(message || '加载中...');
    setLoading(true);
  }, []);

  const hide = useCallback(() => {
    setLoading(false);
  }, []);

  return { loading, tip, show, hide, LoadingComponent: () => <Loading tip={tip} fullScreen /> };
}
