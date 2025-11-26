import { spacing } from '../tokens';

/**
 * ProgressBar component design tokens
 * Maps global tokens to progress bar-specific semantics
 */
export const progressBarTokens = {
  /** Height for each size */
  height: {
    sm: spacing[1], // 0.25rem (4px)
    md: spacing[2], // 0.5rem (8px)
    lg: spacing[3], // 0.75rem (12px)
  },

  /** Border radius */
  radius: spacing[1], // 0.25rem (4px)
} as const;
