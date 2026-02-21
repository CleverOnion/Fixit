// components/Layout/TopNav.tsx
// 顶部导航组件 - 简洁现代设计

import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Avatar, Dropdown, Modal } from 'antd';
import {
  UserOutlined,
  SettingOutlined,
  LogoutOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons';
import { useUserStore } from '../../stores/userStore';
import { ThemeSwitch } from '../Common/ThemeSwitch';
import { useIsMobile } from '../../hooks/useMediaQuery';
import styles from './TopNav.module.css';

// 导航项配置
const navItems = [
  { path: '/', label: '首页', icon: 'home' },
  { path: '/questions', label: '题库', icon: 'file-text' },
  { path: '/practice', label: '练习', icon: 'check-circle' },
  { path: '/stats', label: '统计', icon: 'bar-chart' },
  { path: '/import', label: '录入', icon: 'plus' },
];

// SVG 图标组件 - Exported for reuse in MobileTabBar
export function HomeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
    </svg>
  );
}

export function FileTextIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
    </svg>
  );
}

export function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
  );
}

export function BarChartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
    </svg>
  );
}

export function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
    </svg>
  );
}

export function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
    </svg>
  );
}

// 获取图标组件
function getIcon(iconName: string) {
  const icons: Record<string, React.ComponentType<{ className?: string }>> = {
    'home': HomeIcon,
    'file-text': FileTextIcon,
    'check-circle': CheckCircleIcon,
    'bar-chart': BarChartIcon,
    'plus': PlusIcon,
    'search': SearchIcon,
  };
  const Icon = icons[iconName] || HomeIcon;
  return <Icon className={styles.navIcon} />;
}

export function TopNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useUserStore();
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const isMobile = useIsMobile();
  const searchInputRef = useRef<HTMLInputElement>(null);

  // 快捷键打开搜索
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchModalOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown, { passive: false });
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Modal 打开时聚焦输入框（仅在桌面端）
  useEffect(() => {
    if (searchModalOpen && !isMobile && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchModalOpen, isMobile]);

  const handleMenuClick = ({ key }: { key: string }) => {
    switch (key) {
      case 'profile':
        navigate('/profile');
        break;
      case 'settings':
        navigate('/settings');
        break;
      case 'help':
        window.open('https://github.com/your-repo', '_blank');
        break;
      case 'logout':
        logout();
        navigate('/login');
        break;
    }
  };

  const userMenuItems = [
    { key: 'profile', label: '个人中心', icon: <UserOutlined /> },
    { key: 'settings', label: '设置', icon: <SettingOutlined /> },
    { type: 'divider' as const },
    { key: 'help', label: '帮助文档', icon: <QuestionCircleOutlined /> },
    { type: 'divider' as const },
    { key: 'logout', label: '退出登录', icon: <LogoutOutlined />, danger: true },
  ];

  return (
    <>
      <header className={styles.nav}>
        <div className={styles.left}>
          {/* Logo */}
          <Link to="/" className={styles.logo} aria-label="Fixit 首页">
            <svg className={styles.logoIcon} viewBox="0 0 32 32" fill="none" role="img" aria-label="Fixit Logo">
              <rect width="32" height="32" rx="8" fill="url(#nav-logo-gradient)" />
              <path d="M10 16L14 20L22 12" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <defs>
                <linearGradient id="nav-logo-gradient" x1="0" y1="0" x2="32" y2="32">
                  <stop stopColor="#ff6b6b" />
                  <stop offset="1" stopColor="#e54d2e" />
                </linearGradient>
              </defs>
            </svg>
            <span className={styles.logoText}>Fixit</span>
          </Link>

          {/* 导航链接 */}
          <nav className={styles.navLinks}>
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`${styles.navLink} ${
                  location.pathname === item.path ? styles.navLinkActive : ''
                }`}
              >
                {getIcon(item.icon)}
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>

        <div className={styles.right}>
          {/* 主题切换 */}
          <ThemeSwitch />

          {/* 搜索按钮 */}
          <button
            className={styles.searchBtn}
            onClick={() => setSearchModalOpen(true)}
            aria-label="搜索题目、标签…"
          >
            <SearchIcon className={styles.searchIcon} aria-hidden="true" />
            <span className={styles.searchText}>搜索</span>
            <kbd className={styles.searchKbd}>⌘&nbsp;K</kbd>
          </button>

          {/* 用户菜单 */}
          <Dropdown
            menu={{ items: userMenuItems, onClick: handleMenuClick }}
            placement="bottomRight"
            trigger={['click']}
          >
            <button
              className={styles.userMenu}
              aria-label="用户菜单"
              type="button"
            >
              <Avatar
                size={32}
                src={user?.avatar}
                icon={!user?.avatar && <UserOutlined />}
                style={{ backgroundColor: '#ff6b6b' }}
              />
            </button>
          </Dropdown>
        </div>
      </header>

      {/* 搜索 Modal */}
      <Modal
        open={searchModalOpen}
        onCancel={() => setSearchModalOpen(false)}
        footer={null}
        closable={false}
        width={560}
        className={styles.searchModal}
      >
        <div className={styles.searchModalContent}>
          <SearchIcon className={styles.searchModalIcon} aria-hidden="true" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="搜索题目、标签…"
            className={styles.searchModalInput}
          />
        </div>
        <div className={styles.searchModalHint}>
          按 <kbd>Esc</kbd> 关闭
        </div>
      </Modal>
    </>
  );
}
