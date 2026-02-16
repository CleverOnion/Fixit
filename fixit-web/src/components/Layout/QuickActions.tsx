// components/Layout/QuickActions.tsx
// 悬浮快捷操作按钮

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Tooltip } from 'antd';
import styles from './QuickActions.module.css';

interface QuickActionsProps {
  todayCount?: number;
}

const actions = [
  {
    key: 'import',
    path: '/import',
    icon: 'plus',
    label: '录入题目',
    color: '#ff6b6b',
    shortcut: 'I',
  },
  {
    key: 'practice',
    path: '/practice',
    icon: 'thunderbolt',
    label: '开始练习',
    color: '#10b981',
    shortcut: 'P',
  },
  {
    key: 'invitation',
    path: '/invitation',
    icon: 'key',
    label: '邀请码',
    color: '#8b5cf6',
    shortcut: '',
  },
];

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  );
}

function ThunderboltIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function KeyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function getIcon(iconName: string) {
  switch (iconName) {
    case 'plus':
      return <PlusIcon className={styles.actionIcon} />;
    case 'thunderbolt':
      return <ThunderboltIcon className={styles.actionIcon} />;
    case 'key':
      return <KeyIcon className={styles.actionIcon} />;
    default:
      return <PlusIcon className={styles.actionIcon} />;
  }
}

export function QuickActions({ todayCount = 0 }: QuickActionsProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`${styles.container} ${expanded ? styles.expanded : ''}`}>
      {/* 展开的 Actions */}
      <div className={styles.actions}>
        {actions.map((action) => (
          <Tooltip key={action.key} title={action.label} placement="left">
            <Link
              to={action.path}
              className={styles.action}
              style={{ '--action-color': action.color } as React.CSSProperties}
            >
              {getIcon(action.icon)}
              <span className={styles.actionLabel}>{action.label}</span>
            </Link>
          </Tooltip>
        ))}
      </div>

      {/* 主按钮 */}
      <Tooltip title="快捷操作" placement="left">
        <button
          className={styles.mainBtn}
          onClick={() => setExpanded(!expanded)}
          style={{ '--main-color': todayCount > 0 ? '#ff6b6b' : '#6366f1' } as React.CSSProperties}
        >
          {expanded ? (
            <PlusIcon className={styles.closeIcon} />
          ) : (
            <ThunderboltIcon className={styles.mainIcon} />
          )}
        </button>
      </Tooltip>
    </div>
  );
}
