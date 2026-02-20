// components/Common/EmptyState.tsx
// 统一空状态组件

import { Button, Empty } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';

interface EmptyStateProps {
  title?: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  link?: {
    to: string;
    label: string;
  };
  image?: React.ReactNode;
}

export function EmptyState({
  title = '暂无数据',
  description,
  action,
  link,
  image,
}: EmptyStateProps) {
  const defaultImage = (
    <div
      style={{
        fontSize: 64,
        color: '#D9D9D9',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
      }}
    >
      📭
    </div>
  );

  return (
    <div style={{ padding: 48, textAlign: "center" }}>
      <Empty
        image={image || defaultImage}
        description={description || null}
      >
        {title && (
          <div style={{ fontSize: 16, fontWeight: 500, color: "#262626", marginTop: 8 }}>
            {title}
          </div>
        )}
        {(action || link) && (
          <div style={{ marginTop: 16, display: "flex", gap: 8, justifyContent: "center" }}>
            {action && (
              <Button type="primary" icon={<PlusOutlined />} onClick={action.onClick}>
                {action.label}
              </Button>
            )}
            {link && (
              <Link to={link.to}>
                <Button>{link.label}</Button>
              </Link>
            )}
          </div>
        )}
      </Empty>
      {description && !title && (
        <div style={{ marginTop: 8, fontSize: 14, color: "#8c8c8c" }}>
          {description}
        </div>
      )}
    </div>
  );
}

// 预设空状态
export const EmptyStates = {
  // 无题目
  noQuestions: (onImport?: () => void) => (
    <EmptyState
      title="暂无题目"
      description="开始录入你的第一道错题吧！"
      action={{ label: '开始录入', onClick: onImport || (() => {}) }}
      image={<span style={{ fontSize: 64 }}>📝</span>}
    />
  ),

  // 无搜索结果
  noSearchResults: (onClear?: () => void) => (
    <EmptyState
      title="未找到相关题目"
      description="请尝试其他搜索条件"
      action={{ label: '清除筛选', onClick: onClear || (() => {}) }}
      image={<span style={{ fontSize: 64 }}>🔍</span>}
    />
  ),

  // 无复习任务
  noReviewTasks: () => (
    <EmptyState
      title="今日复习已完成"
      description="继续保持这个节奏，明天继续复习！"
      image={<span style={{ fontSize: 64 }}>🎉</span>}
    />
  ),

  // 无统计数据
  noStats: () => (
    <EmptyState
      title="暂无统计数据"
      description="开始学习后就会显示统计数据"
      image={<span style={{ fontSize: 64 }}>📊</span>}
    />
  ),

  // 网络错误
  networkError: (onRetry?: () => void) => {
    const handleReload = () => {
      if (confirm('确定要刷新页面吗？')) {
        window.location.reload();
      }
    };
    return (
      <EmptyState
        title="网络错误"
        description="请检查网络连接后重试"
        action={{ label: '重新加载', onClick: onRetry || handleReload }}
        image={<span style={{ fontSize: 64 }}>🌐</span>}
      />
    );
  },
};
