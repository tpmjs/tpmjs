import { spacing } from '../tokens';

/**
 * Avatar component design tokens
 * Maps global tokens to avatar-specific semantics
 */
export const avatarTokens = {
  /** Dimensions for each size */
  size: {
    xs: spacing[6], // 1.5rem (24px)
    sm: spacing[8], // 2rem (32px)
    md: spacing[10], // 2.5rem (40px)
    lg: spacing[12], // 3rem (48px)
    xl: spacing[16], // 4rem (64px)
  },

  /** Font sizes for initials at each size */
  fontSize: {
    xs: '0.625rem', // 10px
    sm: '0.75rem', // 12px
    md: '0.875rem', // 14px
    lg: '1rem', // 16px
    xl: '1.25rem', // 20px
  },

  /** Border width */
  borderWidth: '2px',
} as const;
