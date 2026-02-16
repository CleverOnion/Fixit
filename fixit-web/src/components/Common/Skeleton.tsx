// components/Common/Skeleton.tsx
// 骨架屏组件

import { Skeleton, Card, SkeletonProps } from 'antd';

interface SkeletonCardProps extends Omit<SkeletonProps, 'active'> {
  loading?: boolean;
  count?: number;
}

// 通用卡片骨架
export function SkeletonCard({ loading = true, count = 1, ...props }: SkeletonCardProps) {
  if (!loading) return null;

  return (
    <Card style={{ marginBottom: 16 }}>
      {[...Array(count)].map((_, i) => (
        <Skeleton
          key={i}
          active
          paragraph={{ rows: 3 }}
          title={{ width: '40%' }}
          {...props}
        />
      ))}
    </Card>
  );
}

// 表格骨架
export function SkeletonTable({ loading = true, rows = 5, columns = 4 }: { loading?: boolean; rows?: number; columns?: number }) {
  if (!loading) return null;

  return (
    <div className="skeleton-table" style={{ padding: 16 }}>
      {/* 表头骨架 */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
        {[...Array(columns)].map((_, i) => (
          <Skeleton.Input key={i} active size="small" style={{ width: `${100 / columns}%`, height: 20 }} />
        ))}
      </div>
      {/* 行骨架 */}
      {[...Array(rows)].map((_, i) => (
        <div key={i} style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
          {[...Array(columns)].map((_, j) => (
            <Skeleton.Input key={j} active size="small" style={{ width: `${100 / columns}%`, height: 32 }} />
          ))}
        </div>
      ))}
    </div>
  );
}

// 详情页骨架
export function SkeletonDetail({ loading = true }: { loading?: boolean }) {
  if (!loading) return null;

  return (
    <div className="skeleton-detail" style={{ padding: 24 }}>
      <Skeleton active title={{ width: '30%' }} paragraph={{ rows: 8 }} />
    </div>
  );
}

// 个人中心骨架
export function SkeletonProfile({ loading = true }: { loading?: boolean }) {
  if (!loading) return null;

  return (
    <div className="skeleton-profile" style={{ display: 'flex', gap: 24, padding: 24 }}>
      <Skeleton.Avatar active size={64} />
      <div style={{ flex: 1 }}>
        <Skeleton active title={{ width: '20%' }} paragraph={{ rows: 2 }} />
      </div>
    </div>
  );
}
