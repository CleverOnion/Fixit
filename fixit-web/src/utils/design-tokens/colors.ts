// design-tokens/colors.ts
// Fixit 错题本应用 - 色彩系统

// 主色 - Ant Design Blue
export const primaryColors = {
  50: '#E6F7FF',
  100: '#BAE7FF',
  200: '#91D5FF',
  300: '#69C0FF',
  400: '#40A9FF',
  500: '#1890FF', // 主色
  600: '#096DD9',
  700: '#0050B3',
  800: '#003A8C',
  900: '#002766',
};

// 功能色
export const functionalColors = {
  success: '#52C41A',
  warning: '#FAAD14',
  error: '#FF4D4F',
  info: '#1890FF',
};

// 掌握程度配色
export const masteryColors = {
  default: '#D9D9D9',   // 未学
  beginner: '#BFBFBF',  // 初学
  familiar: '#52C41A',  // 熟悉
  proficient: '#1890FF', // 掌握
  expert: '#722ED1',    // 精通
  master: '#FAAD14',    // 专家
};

// 中性色
export const grayColors = {
  50: '#FAFAFA',
  100: '#F5F5F5',
  200: '#E8E8E8',
  300: '#D9D9D9',
  400: '#BFBFBF',
  500: '#8C8C8C',
  600: '#595959',
  700: '#434343',
  800: '#262626',
  900: '#141414',
};

// 导出完整色彩系统
export const colors = {
  primary: primaryColors,
  success: functionalColors.success,
  warning: functionalColors.warning,
  error: functionalColors.error,
  info: functionalColors.info,
  mastery: masteryColors,
  gray: grayColors,
};
