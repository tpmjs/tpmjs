import { spacing } from '../tokens';

/**
 * Header component design tokens
 * Maps global tokens to header-specific semantics
 */
export const headerTokens = {
  /** Height for each size */
  height: {
    sm: '3rem', // 48px
    md: '4rem', // 64px
    lg: '5rem', // 80px
  },

  /** Horizontal padding for each size */
  padding: {
    sm: spacing[4], // 1rem (16px)
    md: spacing[6], // 1.5rem (24px)
    lg: spacing[8], // 2rem (32px)
  },
} as const;
