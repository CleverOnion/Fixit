// components/Layout/Header.tsx
// 全局头部组件

import { useNavigate } from 'react-router-dom';
import { Layout, Avatar, Dropdown, Button } from 'antd';
import {
  UserOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons';
import { useUserStore } from '../../stores/userStore';

const { Header: AntHeader } = Layout;

interface HeaderProps {
  collapsed: boolean;
  onCollapse: (collapsed: boolean) => void;
}

export function Header({ collapsed, onCollapse }: HeaderProps) {
  const navigate = useNavigate();
  const { user, logout } = useUserStore();

  const handleMenuClick = ({ key }: { key: string }) => {
    switch (key) {
      case 'profile':
        navigate('/profile');
        break;
      case 'settings':
        navigate('/settings');
        break;
      case 'logout':
        logout();
        navigate('/login');
        break;
    }
  };

  return (
    <AntHeader
      className="layout-header"
      style={{
        background: '#fff',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 1px 4px rgba(0, 0, 0, 0.08)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      {/* 左侧：折叠按钮 */}
      <Button
        type="text"
        icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        onClick={() => onCollapse(!collapsed)}
        className="collapse-btn"
      />

      {/* 右侧：用户信息 */}
      <Dropdown menu={{ items: [
        {
          key: 'profile',
          label: '个人中心',
          icon: <UserOutlined />,
        },
      ], onClick: handleMenuClick }} placement="bottomRight">
        <div className="user-info" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#1890FF' }} />
          <span className="username" style={{ marginLeft: 8 }}>
            {user?.nickname || '用户'}
          </span>
        </div>
      </Dropdown>
    </AntHeader>
  );
}
