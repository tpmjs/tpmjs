import { spacing } from '../tokens';

/**
 * Textarea-specific design tokens
 */
export const textareaTokens = {
  /**
   * Minimum height for different sizes
   * Based on approximate row counts
   */
  minHeight: {
    sm: spacing[20], // ~80px (5 rows)
    md: spacing[32], // ~128px (8 rows)
    lg: spacing[40], // ~160px (10 rows)
  },

  /**
   * Padding for different sizes
   * Slightly more vertical padding than Input for better multi-line readability
   */
  padding: {
    sm: {
      x: spacing[3], // 12px
      y: spacing[2], // 8px
    },
    md: {
      x: spacing[3], // 12px
      y: spacing[2.5], // 10px
    },
    lg: {
      x: spacing[4], // 16px
      y: spacing[3], // 12px
    },
  },

  /**
   * Character counter styling
   */
  counter: {
    fontSize: '0.75rem', // 12px
    spacing: spacing[1.5], // 6px top margin
  },
} as const;
