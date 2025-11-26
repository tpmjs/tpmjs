import { formTokens } from '../tokens';

/**
 * Radio-specific design tokens
 */
export const radioTokens = {
  /**
   * Control size for different variants
   */
  size: formTokens.control.size,

  /**
   * Gap between radio and label
   */
  gap: formTokens.gap.label,

  /**
   * Inner dot styling
   */
  dot: {
    scale: {
      unchecked: '0',
      checked: '1',
    },
    size: {
      sm: '6px', // 37.5% of 16px
      md: '8px', // 40% of 20px
      lg: '10px', // 41.6% of 24px
    },
  },

  /**
   * Transition timings
   */
  transition: {
    duration: formTokens.transition.duration.base,
    easing: formTokens.transition.easing,
  },

  /**
   * Group spacing
   */
  group: {
    gap: formTokens.gap.group,
  },
} as const;
