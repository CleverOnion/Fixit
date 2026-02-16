// design-tokens/typography.ts
// Fixit 错题本应用 - 字体系统

export const typography = {
  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  fontFamilyMono: '"Fira Code", "Consolas", "Monaco", "Courier New", monospace',

  // 字号层级
  size: {
    h1: 38,
    h2: 30,
    h3: 24,
    h4: 20,
    h5: 16,
    body: 14,
    caption: 12,
    small: 10,
  },

  // 字重
  weight: {
    bold: 600,
    medium: 500,
    regular: 400,
  },

  // 行高
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    loose: 1.75,
  },

  // 标题样式
  headings: {
    h1: {
      fontSize: 38,
      fontWeight: 600,
      lineHeight: 1.23,
    },
    h2: {
      fontSize: 30,
      fontWeight: 600,
      lineHeight: 1.27,
    },
    h3: {
      fontSize: 24,
      fontWeight: 600,
      lineHeight: 1.33,
    },
    h4: {
      fontSize: 20,
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h5: {
      fontSize: 16,
      fontWeight: 600,
      lineHeight: 1.5,
    },
  },

  // 正文样式
  body: {
    regular: {
      fontSize: 14,
      fontWeight: 400,
      lineHeight: 1.5,
    },
    medium: {
      fontSize: 14,
      fontWeight: 500,
      lineHeight: 1.5,
    },
  },

  // 辅助文字
  caption: {
    regular: {
      fontSize: 12,
      fontWeight: 400,
      lineHeight: 1.5,
    },
    medium: {
      fontSize: 12,
      fontWeight: 500,
      lineHeight: 1.5,
    },
  },
};
