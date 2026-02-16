// design-tokens/index.ts
// Fixit 错题本应用 - 设计令牌导出

// 导出所有设计令牌
export * from './colors';
export * from './typography';
export * from './spacing';
export * from './components';

// 导出完整设计令牌对象
import { colors } from './colors';
import { typography } from './typography';
import { spacing } from './spacing';
import { components } from './components';

export const designTokens = {
  colors,
  typography,
  spacing,
  components,
};

// 导出常用快捷方式
export const tokens = {
  // 色彩
  primary: colors.primary[500],
  success: colors.success,
  warning: colors.warning,
  error: colors.error,
  info: colors.info,

  // 掌握程度
  masteryLevel: {
    default: colors.mastery.default,
    beginner: colors.mastery.beginner,
    familiar: colors.mastery.familiar,
    proficient: colors.mastery.proficient,
    expert: colors.mastery.expert,
    master: colors.mastery.master,
  },

  // 间距
  ...spacing,

  // 组件
  buttonRadius: components.button.borderRadius,
  cardRadius: components.card.borderRadius,
  inputRadius: components.input.borderRadius,
};
