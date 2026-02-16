// Responsive breakpoints for Fixit application
// Consistent breakpoint system for all responsive design decisions

export const breakpoints = {
  xs: '375px',   // Small phones
  sm: '480px',   // Large phones
  md: '768px',   // Tablet portrait
  lg: '1024px',  // Tablet landscape / small laptops
  xl: '1280px',  // Desktop
  '2xl': '1400px' // Large desktop
} as const

export type Breakpoint = keyof typeof breakpoints

// Media query utilities for use in styled-components or inline styles
export const media = {
  xs: `@media (min-width: ${breakpoints.xs})`,
  sm: `@media (min-width: ${breakpoints.sm})`,
  md: `@media (min-width: ${breakpoints.md})`,
  lg: `@media (min-width: ${breakpoints.lg})`,
  xl: `@media (min-width: ${breakpoints.xl})`,
  '2xl': `@media (min-width: ${breakpoints['2xl']})`,

  below: {
    xs: `@media (max-width: ${parseInt(breakpoints.xs) - 1}px)`,
    sm: `@media (max-width: ${parseInt(breakpoints.sm) - 1}px)`,
    md: `@media (max-width: ${parseInt(breakpoints.md) - 1}px)`,
    lg: `@media (max-width: ${parseInt(breakpoints.lg) - 1}px)`,
    xl: `@media (max-width: ${parseInt(breakpoints.xl) - 1}px)`,
  }
}
