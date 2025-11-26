/**
 * Animation token system for TPMJS UI
 * Smooth, subtle transitions for polished micro-interactions
 */

/**
 * Animation durations
 */
export const duration = {
  fast: '150ms',
  base: '200ms',
  slow: '300ms',
  slower: '500ms',
  slowest: '700ms',
} as const;

/**
 * Easing functions
 * Cubic bezier curves for natural motion
 */
export const easing = {
  linear: 'linear',
  ease: 'ease',
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  // Custom easings for specific interactions
  smooth: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
  bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
} as const;

/**
 * Keyframe animations
 * Predefined animation sequences
 */
export const keyframes = {
  fadeIn: {
    from: { opacity: '0' },
    to: { opacity: '1' },
  },
  fadeOut: {
    from: { opacity: '1' },
    to: { opacity: '0' },
  },
  slideUp: {
    from: { transform: 'translateY(10px)', opacity: '0' },
    to: { transform: 'translateY(0)', opacity: '1' },
  },
  slideDown: {
    from: { transform: 'translateY(-10px)', opacity: '0' },
    to: { transform: 'translateY(0)', opacity: '1' },
  },
  slideLeft: {
    from: { transform: 'translateX(10px)', opacity: '0' },
    to: { transform: 'translateX(0)', opacity: '1' },
  },
  slideRight: {
    from: { transform: 'translateX(-10px)', opacity: '0' },
    to: { transform: 'translateX(0)', opacity: '1' },
  },
  scaleIn: {
    from: { transform: 'scale(0.95)', opacity: '0' },
    to: { transform: 'scale(1)', opacity: '1' },
  },
  scaleOut: {
    from: { transform: 'scale(1)', opacity: '1' },
    to: { transform: 'scale(0.95)', opacity: '0' },
  },
  shimmer: {
    '0%': { backgroundPosition: '-1000px 0' },
    '100%': { backgroundPosition: '1000px 0' },
  },
  pulse: {
    '0%, 100%': { opacity: '1' },
    '50%': { opacity: '0.5' },
  },
  spin: {
    from: { transform: 'rotate(0deg)' },
    to: { transform: 'rotate(360deg)' },
  },
  ping: {
    '75%, 100%': { transform: 'scale(2)', opacity: '0' },
  },
  bounce: {
    '0%, 100%': {
      transform: 'translateY(-25%)',
      animationTimingFunction: 'cubic-bezier(0.8, 0, 1, 1)',
    },
    '50%': {
      transform: 'translateY(0)',
      animationTimingFunction: 'cubic-bezier(0, 0, 0.2, 1)',
    },
  },
} as const;

/**
 * Transition presets
 * Commonly used transition combinations
 */
export const transitions = {
  /** Base transition for colors and backgrounds */
  base: `background-color ${duration.base} ${easing.easeInOut}, border-color ${duration.base} ${easing.easeInOut}, color ${duration.base} ${easing.easeInOut}`,

  /** Transform transition */
  transform: `transform ${duration.base} ${easing.easeInOut}`,

  /** Opacity transition */
  opacity: `opacity ${duration.base} ${easing.easeInOut}`,

  /** All properties transition */
  all: `all ${duration.slow} ${easing.easeInOut}`,

  /** Fast transition for immediate feedback */
  fast: `all ${duration.fast} ${easing.easeOut}`,

  /** Smooth transition for hover effects */
  smooth: `all ${duration.base} ${easing.smooth}`,
} as const;

/**
 * Complete animations export
 */
export const animations = {
  duration,
  easing,
  keyframes,
  transitions,
} as const;
