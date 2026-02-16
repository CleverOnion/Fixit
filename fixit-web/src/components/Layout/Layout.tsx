// components/Layout/Layout.tsx
// 全局布局组件 - 新版简洁导航设计

import { ReactNode } from 'react';
import { TopNav } from './TopNav';
import { QuickActions } from './QuickActions';
import styles from './Layout.module.css';

interface LayoutProps {
  children: ReactNode;
  todayCount?: number;
}

export function Layout({ children, todayCount = 0 }: LayoutProps) {
  return (
    <div className={styles.layout}>
      <TopNav />
      <main className={styles.main}>
        <div className={styles.pageContainer}>
          {children}
        </div>
      </main>
      <QuickActions todayCount={todayCount} />
    </div>
  );
}
