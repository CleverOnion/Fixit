// components/Common/ThemeSwitch.tsx
// 主题切换组件 - 太阳/月亮动画切换

import { useUIStore } from '../../stores/uiStore';
import styles from './ThemeSwitch.module.css';

export function ThemeSwitch() {
  const { theme, setTheme } = useUIStore();

  const toggleTheme = () => {
    setTheme(theme === 'day' ? 'night' : 'day');
  };

  const isDay = theme === 'day';

  return (
    <button
      className={`${styles.themeSwitch} ${!isDay ? styles.checked : ''}`}
      onClick={toggleTheme}
      aria-label={isDay ? '切换到黑夜模式' : '切换到白天模式'}
    >
      <div className={styles.track}>
        <div className={styles.clouds} />
        <div className={styles.stars} />
        <div className={styles.slider}>
          <div className={styles.craters}>
            <span />
            <span />
            <span />
          </div>
        </div>
      </div>
    </button>
  );
}
