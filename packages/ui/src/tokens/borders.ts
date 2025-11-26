/**
 * Border token system for TPMJS UI
 * 1px borders with dotted/dashed variants for technical aesthetic
 */

/**
 * Border widths
 */
export const borderWidth = {
  DEFAULT: '1px',
  0: '0',
  2: '2px',
  4: '4px',
  8: '8px',
} as const;

/**
 * Border styles
 */
export const borderStyle = {
  solid: 'solid',
  dashed: 'dashed',
  dotted: 'dotted',
  none: 'none',
} as const;

/**
 * Border radius values
 * References CSS variables for theme consistency
 */
export const borderRadius = {
  none: '0',
  sm: 'var(--radius-sm)',
  md: 'var(--radius-md)',
  lg: 'var(--radius-lg)',
  xl: 'var(--radius-xl)',
  '2xl': 'var(--radius-2xl, 1rem)',
  '3xl': 'var(--radius-3xl, 1.5rem)',
  full: '9999px',
} as const;

/**
 * CSS variable border radius tokens
 * Used in globals.css
 */
export const borderRadiusVars = {
  sm: '4px',
  md: '6px',
  lg: '8px',
  xl: '12px',
} as const;

/**
 * Border color references (use CSS variables)
 */
export const borderColor = {
  DEFAULT: 'hsl(var(--border))',
  strong: 'hsl(var(--border-strong))',
  subtle: 'hsl(var(--border-subtle))',
  input: 'hsl(var(--input))',
  ring: 'hsl(var(--ring))',
} as const;

/**
 * Complete border export
 */
export const borders = {
  width: borderWidth,
  style: borderStyle,
  radius: borderRadius,
  color: borderColor,
} as const;
