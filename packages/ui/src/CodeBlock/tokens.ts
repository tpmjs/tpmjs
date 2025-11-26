import { fontSize, spacing } from '../tokens';

/**
 * CodeBlock component design tokens
 * Maps global tokens to code block-specific semantics
 */
export const codeBlockTokens = {
  /** Padding for each size */
  padding: {
    sm: spacing[3], // 0.75rem (12px)
    md: spacing[4], // 1rem (16px)
    lg: spacing[6], // 1.5rem (24px)
  },

  /** Font size for each size */
  fontSize: {
    sm: fontSize.xs, // 0.75rem (12px)
    md: fontSize.sm, // 0.875rem (14px)
    lg: fontSize.base, // 1rem (16px)
  },

  /** Border radius */
  radius: spacing[2], // 0.5rem (8px)
} as const;
