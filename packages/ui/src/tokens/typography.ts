/**
 * Typography token system for TPMJS UI
 * Geist-inspired with generous spacing and technical feel
 */

/**
 * Font families
 * Geist font stack with system fallbacks
 */
export const fontFamily = {
  sans: [
    'Geist',
    '-apple-system',
    'BlinkMacSystemFont',
    '"Segoe UI"',
    'Roboto',
    '"Helvetica Neue"',
    'Arial',
    'sans-serif',
  ],
  mono: [
    'Geist Mono',
    '"SF Mono"',
    'Monaco',
    'Consolas',
    '"Liberation Mono"',
    '"Courier New"',
    'monospace',
  ],
} as const;

/**
 * Font sizes with line heights and letter spacing
 * Generous line heights for readability
 * Tighter letter spacing for larger sizes (optical sizing)
 */
export const fontSize = {
  xs: ['0.75rem', { lineHeight: '1rem', letterSpacing: '0' }],
  sm: ['0.875rem', { lineHeight: '1.25rem', letterSpacing: '0' }],
  base: ['1rem', { lineHeight: '1.5rem', letterSpacing: '0' }],
  lg: ['1.125rem', { lineHeight: '1.75rem', letterSpacing: '-0.01em' }],
  xl: ['1.25rem', { lineHeight: '1.75rem', letterSpacing: '-0.01em' }],
  '2xl': ['1.5rem', { lineHeight: '2rem', letterSpacing: '-0.02em' }],
  '3xl': ['1.875rem', { lineHeight: '2.25rem', letterSpacing: '-0.02em' }],
  '4xl': ['2.25rem', { lineHeight: '2.5rem', letterSpacing: '-0.03em' }],
  '5xl': ['3rem', { lineHeight: '1', letterSpacing: '-0.03em' }],
  '6xl': ['3.75rem', { lineHeight: '1', letterSpacing: '-0.04em' }],
  '7xl': ['4.5rem', { lineHeight: '1', letterSpacing: '-0.04em' }],
  '8xl': ['6rem', { lineHeight: '1', letterSpacing: '-0.05em' }],
  '9xl': ['8rem', { lineHeight: '1', letterSpacing: '-0.05em' }],
} as const;

/**
 * Font weights
 */
export const fontWeight = {
  light: '300',
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
} as const;

/**
 * Letter spacing values
 */
export const letterSpacing = {
  tighter: '-0.05em',
  tight: '-0.025em',
  normal: '0',
  wide: '0.025em',
  wider: '0.05em',
  widest: '0.1em',
} as const;

/**
 * Line heights
 */
export const lineHeight = {
  none: '1',
  tight: '1.25',
  snug: '1.375',
  normal: '1.5',
  relaxed: '1.625',
  loose: '2',
} as const;

/**
 * Complete typography export
 */
export const typography = {
  fontFamily,
  fontSize,
  fontWeight,
  letterSpacing,
  lineHeight,
} as const;
