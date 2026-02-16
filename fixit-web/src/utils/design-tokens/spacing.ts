// design-tokens/spacing.ts
// Fixit 错题本应用 - 间距系统

// 基础单位
export const spacingBase = 4;

// 间距 token
export const spacing = {
  // 基础倍数
  xs: spacingBase,           // 4px
  sm: spacingBase * 2,        // 8px
  md: spacingBase * 4,        // 16px
  lg: spacingBase * 6,        // 24px
  xl: spacingBase * 8,        // 32px
  xxl: spacingBase * 12,      // 48px
  xxxl: spacingBase * 16,     // 64px

  // 紧凑间距
  tight: {
    xs: spacingBase / 2,      // 2px
    sm: spacingBase,          // 4px
    md: spacingBase * 2,      // 8px
    lg: spacingBase * 3,      // 12px
  },

  // 宽松间距
  relaxed: {
    md: spacingBase * 5,      // 20px
    lg: spacingBase * 8,      // 32px
    xl: spacingBase * 12,     // 48px
    xxl: spacingBase * 16,    // 64px
  },

  // 布局间距
  layout: {
    header: 64,
    sidebar: 220,
    sidebarCollapsed: 80,
    container: 24,
    section: 48,
  },

  // 组件内部间距
  component: {
    xs: spacingBase,          // 4px
    sm: spacingBase * 2,       // 8px
    md: spacingBase * 3,       // 12px
    lg: spacingBase * 4,       // 16px
  },
};

// 导出快捷方式
export const { xs, sm, md, lg, xl, xxl, xxxl } = spacing;
