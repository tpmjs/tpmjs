import { spacing } from '../tokens';

/**
 * Container component design tokens
 * Maps global tokens to container-specific semantics
 */
export const containerTokens = {
  /** Maximum widths for each size */
  maxWidth: {
    sm: '640px', // max-w-screen-sm
    md: '768px', // max-w-screen-md
    lg: '1024px', // max-w-screen-lg
    xl: '1280px', // max-w-screen-xl
    '2xl': '1536px', // max-w-screen-2xl
    full: '100%', // max-w-full
  },

  /** Horizontal padding for each size */
  padding: {
    none: spacing[0], // 0
    sm: spacing[4], // 1rem (16px)
    md: spacing[6], // 1.5rem (24px)
    lg: spacing[8], // 2rem (32px)
  },
} as const;
