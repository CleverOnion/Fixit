// components/Layout/AppNav.tsx
// Mac 应用式导航 - 极简图标 + 命令面板
// 参考 Linear/Notion 设计语言

import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Tooltip, Avatar, Dropdown } from 'antd';
import {
  HomeOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  BarChartOutlined,
  PlusOutlined,
  SearchOutlined,
  SettingOutlined,
  LogoutOutlined,
  UserOutlined,
  KeyOutlined,
} from '@ant-design/icons';
import { useUserStore } from '../../stores/userStore';
import styles from './AppNav.module.css';

interface NavItem {
  key: string;
  icon: React.ReactNode;
  label: string;
  shortcut?: string;
}

const navItems: NavItem[] = [
  { key: '/', icon: <HomeOutlined />, label: '首页', shortcut: 'H' },
  { key: '/questions', icon: <FileTextOutlined />, label: '题库', shortcut: 'Q' },
  { key: '/practice', icon: <CheckCircleOutlined />, label: '练习', shortcut: 'P' },
  { key: '/stats', icon: <BarChartOutlined />, label: '统计', shortcut: 'S' },
  { key: '/import', icon: <PlusOutlined />, label: '录入', shortcut: 'N' },
];

export function AppNav({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useUserStore();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // 键盘快捷键 Ctrl/Cmd + K 打开搜索
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 搜索面板打开时自动聚焦
  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  const handleNavClick = (key: string) => {
    navigate(key);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userMenuItems = [
    { key: 'profile', icon: <UserOutlined />, label: '个人资料' },
    { key: 'settings', icon: <SettingOutlined />, label: '设置' },
    { type: 'divider' as const },
    { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', danger: true, onClick: handleLogout },
  ];

  return (
    <div className={styles.container}>
      {/* 左侧极简导航栏 */}
      <nav className={styles.navRail}>
        {/* Logo */}
        <div className={styles.logo}>
          <div className={styles.logoIcon}>F</div>
        </div>

        {/* 导航项 */}
        <div className={styles.navItems}>
          {navItems.map((item) => {
            const isActive = location.pathname === item.key;
            return (
              <Tooltip key={item.key} placement="right" title={item.label}>
                <button
                  className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
                  onClick={() => handleNavClick(item.key)}
                  aria-label={item.label}
                >
                  <span className={styles.navIcon}>{item.icon}</span>
                </button>
              </Tooltip>
            );
          })}
        </div>

        {/* 底部用户 */}
        <div className={styles.navFooter}>
          <Dropdown menu={{ items: userMenuItems }} placement="topRight" trigger={['click']}>
            <button className={styles.userButton}>
              <Avatar
                size={28}
                src={user?.avatar}
                icon={!user?.avatar && <UserOutlined />}
                style={{ backgroundColor: 'var(--fi-primary-500)' }}
              />
            </button>
          </Dropdown>
        </div>
      </nav>

      {/* 顶部命令栏 */}
      <header className={styles.topBar}>
        <div className={styles.searchTrigger} onClick={() => setSearchOpen(true)}>
          <SearchOutlined className={styles.searchIcon} />
          <span className={styles.searchPlaceholder}>搜索...</span>
          <kbd className={styles.searchShortcut}>
            <KeyOutlined style={{ fontSize: 10 }} />
          </kbd>
        </div>

        <div className={styles.topBarRight}>
          <span className={styles.greeting}>
            {user?.nickname || '用户'}
          </span>
        </div>
      </header>

      {/* 主内容区 */}
      <main className={styles.mainContent}>
        {children}
      </main>

      {/* 搜索面板 */}
      {searchOpen && (
        <div className={styles.searchOverlay} onClick={() => setSearchOpen(false)}>
          <div className={styles.searchPanel} onClick={(e) => e.stopPropagation()}>
            <div className={styles.searchInputWrapper}>
              <SearchOutlined className={styles.searchPanelIcon} />
              <input
                ref={searchInputRef}
                type="text"
                className={styles.searchPanelInput}
                placeholder="搜索题目、标签..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
              />
            </div>
            <div className={styles.searchResults}>
              {searchValue ? (
                <div className={styles.searchHint}>
                  按 Enter 搜索 "{searchValue}"
                </div>
              ) : (
                <div className={styles.searchCommands}>
                  <div className={styles.searchCommandGroup}>
                    <span className={styles.searchCommandLabel}>快捷操作</span>
                    <div
                      className={styles.searchCommandItem}
                      onClick={() => { navigate('/import'); setSearchOpen(false); }}
                    >
                      <PlusOutlined />
                      <span>新建题目</span>
                      <kbd>N</kbd>
                    </div>
                    <div
                      className={styles.searchCommandItem}
                      onClick={() => { navigate('/practice'); setSearchOpen(false); }}
                    >
                      <CheckCircleOutlined />
                      <span>开始练习</span>
                      <kbd>P</kbd>
                    </div>
                    <div
                      className={styles.searchCommandItem}
                      onClick={() => { navigate('/invitation'); setSearchOpen(false); }}
                    >
                      <KeyOutlined />
                      <span>邀请码</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
