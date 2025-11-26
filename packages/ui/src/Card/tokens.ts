import { borderRadius, spacing } from '../tokens';

/**
 * Card component design tokens
 * Maps global tokens to card-specific semantics
 */
export const cardTokens = {
  /** Card padding for each size */
  padding: {
    none: spacing[0], // 0
    sm: spacing[4], // 1rem (16px)
    md: spacing[6], // 1.5rem (24px)
    lg: spacing[8], // 2rem (32px)
  },

  /** Header/Content/Footer padding */
  section: {
    padding: {
      none: spacing[0], // 0
      sm: spacing[4], // 1rem (16px)
      md: spacing[6], // 1.5rem (24px)
      lg: spacing[8], // 2rem (32px)
    },
    gap: spacing[6], // 1.5rem (24px) - space between sections
  },

  /** Title spacing */
  title: {
    marginBottom: spacing[1.5], // 0.375rem (6px)
  },

  /** Description spacing */
  description: {
    marginTop: spacing[2], // 0.5rem (8px)
  },

  /** Border radius */
  borderRadius: borderRadius.lg,

  /** Elevation shadows */
  elevation: {
    default: 'shadow-sm',
    elevated: 'shadow-md',
  },
} as const;
