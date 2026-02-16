// components/Common/ThemeSwitch.tsx
// 主题切换组件 - 白天/黑夜模式切换

import { Button } from 'antd';
import { SunOutlined, MoonOutlined } from '@ant-design/icons';
import { useUIStore } from '../../stores/uiStore';

export function ThemeSwitch() {
  const { theme, setTheme } = useUIStore();

  const toggleTheme = () => {
    setTheme(theme === 'day' ? 'night' : 'day');
  };

  const isDay = theme === 'day';
  const iconColor = isDay ? '#6b7280' : '#f5f5f7';

  return (
    <Button
      type="text"
      onClick={toggleTheme}
      icon={isDay ? <MoonOutlined style={{ color: iconColor }} /> : <SunOutlined style={{ color: iconColor }} />}
      style={{
        fontSize: 18,
        width: 40,
        height: 40,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 10,
        background: isDay ? '#f3f4f6' : '#232326',
        border: '1px solid ' + (isDay ? '#e5e7eb' : '#36363a'),
      }}
      title={isDay ? '切换到黑夜模式' : '切换到白天模式'}
    />
  );
}
