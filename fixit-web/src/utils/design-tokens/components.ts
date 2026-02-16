// design-tokens/components.ts
// Fixit 错题本应用 - 组件风格规范

// Button 组件规范
export const button = {
  borderRadius: 4,
  padding: {
    small: '4px 12px',
    medium: '8px 16px',
    large: '12px 20px',
  },
  fontSize: {
    small: 12,
    medium: 14,
    large: 16,
  },
  colors: {
    primary: '#1890FF',
    danger: '#FF4D4F',
    default: '#FFFFFF',
    disabled: '#D9D9D9',
  },
  shadows: {
    default: '0 2px 0 rgba(0, 0, 0, 0.045)',
    hover: '0 px rgba(0, 0,2px 4 0, 0.1)',
    active: '0 1px 0 rgba(0, 0, 0, 0.1)',
  },
};

// Card 组件规范
export const card = {
  borderRadius: 8,
  padding: 24,
  shadows: {
    default: '0 1px 2px rgba(0, 0, 0, 0.03), 0 2px 6px rgba(0, 0, 0, 0.03)',
    hover: '0 4px 12px rgba(0, 0, 0, 0.08)',
    elevated: '0 8px 24px rgba(0, 0, 0, 0.12)',
  },
  backgrounds: {
    default: '#FFFFFF',
    hover: '#FAFAFA',
    active: '#F5F5F5',
  },
};

// Input 组件规范
export const input = {
  borderRadius: 4,
  height: {
    small: 24,
    medium: 32,
    large: 40,
  },
  colors: {
    border: '#D9D9D9',
    borderHover: '#40A9FF',
    borderFocus: '#1890FF',
    background: '#FFFFFF',
    text: '#595959',
    placeholder: '#BFBFBF',
  },
  shadows: {
    focus: '0 0 0 2px rgba(24, 144, 255, 0.2)',
  },
};

// Table 组件规范
export const table = {
  borderRadius: 8,
  headerHeight: 56,
  rowHeight: 54,
  colors: {
    headerBackground: '#FAFAFA',
    rowHover: '#FAFAFA',
    rowSelected: '#E6F7FF',
    border: '#F0F0F0',
  },
};

// Modal 组件规范
export const modal = {
  borderRadius: 8,
  padding: 24,
  headerHeight: 57,
  footerPadding: 16,
  shadows: {
    default: '0 6px 16px rgba(0, 0, 0, 0.08)',
    confirm: '0 12px 24px rgba(0, 0, 0, 0.12)',
  },
};

// Tag 组件规范
export const tag = {
  borderRadius: {
    default: 4,
    rounded: 12,
    circle: 999,
  },
  padding: {
    small: '2px 8px',
    default: '4px 12px',
  },
  fontSize: 12,
};

// Progress 组件规范
export const progress = {
  height: {
    small: 4,
    default: 8,
    large: 12,
  },
  borderRadius: {
    small: 2,
    default: 4,
    large: 6,
  },
  colors: {
    success: '#52C41A',
    warning: '#FAAD14',
    error: '#FF4D4F',
    default: '#E8E8E8',
  },
};

// 导出完整组件规范
export const components = {
  button,
  card,
  input,
  table,
  modal,
  tag,
  progress,
};
