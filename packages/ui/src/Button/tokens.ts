import { borderRadius, spacing } from '../tokens';

/**
 * Button component design tokens
 * Maps global tokens to button-specific semantics
 */
export const buttonTokens = {
  /** Button heights for each size */
  height: {
    sm: spacing[9], // 2.25rem (36px)
    md: spacing[10], // 2.5rem (40px)
    lg: spacing[11], // 2.75rem (44px)
    icon: spacing[10], // 2.5rem (40px) - square
  },

  /** Horizontal padding for each size */
  padding: {
    x: {
      sm: spacing[3], // 0.75rem (12px)
      md: spacing[4], // 1rem (16px)
      lg: spacing[8], // 2rem (32px)
    },
  },

  /** Gap between icon and text */
  gap: spacing[2], // 0.5rem (8px)

  /** Border radius */
  borderRadius: borderRadius.md,

  /** Transition duration */
  transitionDuration: '200ms',
} as const;
