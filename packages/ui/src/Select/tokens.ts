import { formTokens } from '../tokens';

/**
 * Select-specific design tokens
 */
export const selectTokens = {
  /**
   * Height for different sizes (same as Input)
   */
  height: formTokens.height,

  /**
   * Icon size and positioning
   */
  icon: {
    size: {
      sm: '16px',
      md: '20px',
      lg: '24px',
    },
    spacing: {
      sm: '8px', // Right padding for icon
      md: '12px',
      lg: '16px',
    },
  },

  /**
   * Loading spinner size
   */
  spinner: {
    sm: '14px',
    md: '16px',
    lg: '18px',
  },
} as const;
