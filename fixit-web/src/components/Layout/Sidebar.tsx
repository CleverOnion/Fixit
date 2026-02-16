// components/Layout/Sidebar.tsx
// 全局侧边栏组件

import { Layout, Menu } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  HomeOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  BarChartOutlined,
  PlusOutlined,
} from '@ant-design/icons';

const { Sider: AntSider } = Layout;

interface SidebarProps {
  collapsed: boolean;
}

const menuItems = [
  {
    key: '/',
    icon: <HomeOutlined />,
    label: '首页',
  },
  {
    key: '/questions',
    icon: <FileTextOutlined />,
    label: '题库',
  },
  {
    key: '/practice',
    icon: <CheckCircleOutlined />,
    label: '练习',
  },
  {
    key: '/stats',
    icon: <BarChartOutlined />,
    label: '统计',
  },
  {
    key: '/import',
    icon: <PlusOutlined />,
    label: '录入',
  },
];

export function Sidebar({ collapsed }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  return (
    <AntSider
      trigger={null}
      collapsible
      collapsed={collapsed}
      width={220}
      style={{
        background: '#001529',
        boxShadow: '2px 0 8px rgba(0, 0, 0, 0.15)',
      }}
    >
      {/* Logo */}
      <div
        className="logo"
        style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(255, 255, 255, 0.05)',
          marginBottom: 8,
        }}
      >
        {collapsed ? (
          <span style={{ fontSize: 24, color: '#1890FF' }}>F</span>
        ) : (
          <span style={{ fontSize: 20, fontWeight: 600, color: '#fff' }}>Fixit</span>
        )}
      </div>

      {/* 菜单 */}
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[location.pathname]}
        items={menuItems}
        onClick={handleMenuClick}
        style={{ borderRight: 0 }}
      />
    </AntSider>
  );
}
