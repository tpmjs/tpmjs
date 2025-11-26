import { borderRadius, spacing } from '../tokens';

/**
 * Input component design tokens
 * Maps global tokens to input-specific semantics
 */
export const inputTokens = {
  /** Input heights for each size */
  height: {
    sm: spacing[9], // 2.25rem (36px)
    md: spacing[10], // 2.5rem (40px)
    lg: spacing[11], // 2.75rem (44px)
  },

  /** Horizontal padding for each size */
  padding: {
    x: {
      sm: spacing[3], // 0.75rem (12px)
      md: spacing[3], // 0.75rem (12px)
      lg: spacing[4], // 1rem (16px)
    },
    y: {
      sm: spacing[2], // 0.5rem (8px)
      md: spacing[2.5], // 0.625rem (10px)
      lg: spacing[3], // 0.75rem (12px)
    },
  },

  /** Font sizes for each size */
  fontSize: {
    sm: '0.875rem', // 14px
    md: '1rem', // 16px
    lg: '1.125rem', // 18px
  },

  /** Border radius */
  borderRadius: borderRadius.md,

  /** Border width */
  borderWidth: '1px',

  /** Transition duration */
  transitionDuration: '200ms',
} as const;
