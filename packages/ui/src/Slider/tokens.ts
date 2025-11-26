import { formTokens } from '../tokens';

/**
 * Slider-specific design tokens
 */
export const sliderTokens = {
  /**
   * Track (rail) height for different sizes
   */
  track: {
    sm: '4px',
    md: '6px',
    lg: '8px',
  },

  /**
   * Thumb (handle) dimensions
   */
  thumb: {
    sm: {
      size: '16px',
      activateSize: '18px', // Size when active/focused
    },
    md: {
      size: '20px',
      activeSize: '22px',
    },
    lg: {
      size: '24px',
      activeSize: '26px',
    },
  },

  /**
   * Value display
   */
  value: {
    fontSize: {
      sm: '0.75rem', // 12px
      md: '0.875rem', // 14px
      lg: '1rem', // 16px
    },
    spacing: formTokens.gap.label,
  },

  /**
   * Marks styling
   */
  marks: {
    size: {
      sm: '6px',
      md: '8px',
      lg: '10px',
    },
    spacing: '4px', // Distance from track
  },

  /**
   * Transition timings
   */
  transition: {
    duration: formTokens.transition.duration.base,
    easing: formTokens.transition.easing,
  },
} as const;
