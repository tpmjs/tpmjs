import { formTokens } from '../tokens';

/**
 * Switch-specific design tokens
 */
export const switchTokens = {
  /**
   * Track (background) dimensions for different sizes
   */
  track: {
    sm: {
      width: '36px',
      height: '20px',
    },
    md: {
      width: '44px',
      height: '24px',
    },
    lg: {
      width: '52px',
      height: '28px',
    },
  },

  /**
   * Thumb (sliding circle) dimensions
   */
  thumb: {
    sm: {
      size: '16px',
      translateX: {
        off: '2px',
        on: '18px',
      },
    },
    md: {
      size: '20px',
      translateX: {
        off: '2px',
        on: '22px',
      },
    },
    lg: {
      size: '24px',
      translateX: {
        off: '2px',
        on: '26px',
      },
    },
  },

  /**
   * Gap between switch and label
   */
  gap: formTokens.gap.label,

  /**
   * Transition timings
   */
  transition: {
    duration: formTokens.transition.duration.base,
    easing: formTokens.transition.easing,
  },

  /**
   * Loading spinner size
   */
  spinner: {
    sm: '10px',
    md: '12px',
    lg: '14px',
  },
} as const;
