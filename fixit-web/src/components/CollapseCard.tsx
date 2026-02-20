import React, { useState, useRef, useEffect } from 'react';
import styles from './CollapseCard.module.css';

interface CollapseCardProps {
  title: string;
  icon?: React.ReactNode;
  defaultExpanded?: boolean;
  children: React.ReactNode;
  onToggle?: (expanded: boolean) => void;
  showExpander?: boolean;
}

export function CollapseCard({
  title,
  icon,
  defaultExpanded = false,
  children,
  onToggle,
  showExpander = true,
}: CollapseCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const contentRef = useRef<HTMLDivElement>(null);
  const animatingRef = useRef(false);

  const handleToggle = () => {
    if (animatingRef.current) return;
    const newExpanded = !expanded;
    setExpanded(newExpanded);
    animatingRef.current = true;
    onToggle?.(newExpanded);
  };

  // 使用 CSS transition 实现平滑展开/收起
  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;

    if (expanded) {
      // 展开动画
      content.style.maxHeight = '0px';
      content.style.opacity = '0';
      content.style.overflow = 'hidden';

      // 强制重绘
      content.getBoundingClientRect();

      content.style.maxHeight = `${content.scrollHeight}px`;
      content.style.opacity = '1';
    } else {
      // 收起动画
      content.style.maxHeight = `${content.scrollHeight}px`;
      content.style.opacity = '1';

      // 强制重绘
      content.getBoundingClientRect();

      content.style.maxHeight = '0px';
      content.style.opacity = '0';
    }

    // 动画结束后重置状态
    const timer = setTimeout(() => {
      animatingRef.current = false;
    }, 120);

    return () => clearTimeout(timer);
  }, [expanded, children]);

  return (
    <div className={styles.card}>
      <button
        className={styles.header}
        onClick={handleToggle}
        type="button"
        aria-expanded={expanded}
      >
        <div className={styles.headerLeft}>
          {icon && <span className={styles.icon}>{icon}</span>}
          <span className={styles.title}>{title}</span>
        </div>
        {showExpander && (
          <span className={`${styles.expander} ${expanded ? styles.expanded : ''}`}>
            {expanded ? '∧' : '∨'}
          </span>
        )}
      </button>
      <div
        ref={contentRef}
        className={styles.content}
        style={{
          opacity: expanded ? 1 : 0,
          transition: 'max-height 120ms ease-out, opacity 120ms ease-out',
        }}
      >
        <div className={styles.contentInner}>
          {children}
        </div>
      </div>
    </div>
  );
}
