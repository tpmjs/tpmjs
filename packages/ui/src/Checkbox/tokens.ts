import { formTokens } from '../tokens';

/**
 * Checkbox-specific design tokens
 */
export const checkboxTokens = {
  /**
   * Control size for different variants
   */
  size: formTokens.control.size,

  /**
   * Gap between checkbox and label
   */
  gap: formTokens.gap.label,

  /**
   * Checkmark styling
   */
  checkmark: {
    strokeWidth: formTokens.checkmark.strokeWidth,
    scale: formTokens.checkmark.scale,
  },

  /**
   * Indeterminate state line
   */
  indeterminate: {
    strokeWidth: '2px',
    width: '60%', // Percentage of checkbox width
  },

  /**
   * Transition timings
   */
  transition: {
    duration: formTokens.transition.duration.base,
    easing: formTokens.transition.easing,
  },
} as const;
