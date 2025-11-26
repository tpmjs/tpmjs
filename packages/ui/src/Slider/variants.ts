import { createVariants } from '../system/variants';

/**
 * Slider (range input) variant definitions
 */
export const sliderVariants = createVariants({
  base: [
    // Reset default appearance
    'appearance-none',
    'bg-transparent',
    'cursor-pointer',
    // Focus
    'focus:outline-none',
    // Disabled
    'disabled:cursor-not-allowed disabled:opacity-50',
    // Transitions
    'transition-all duration-200',
  ].join(' '),

  variants: {
    state: {
      default: '',
      error: '',
      success: '',
    },

    size: {
      sm: 'h-4',
      md: 'h-5',
      lg: 'h-6',
    },

    fullWidth: {
      true: 'w-full',
      false: 'w-auto min-w-48',
    },
  },

  compoundVariants: [],

  defaultVariants: {
    state: 'default',
    size: 'md',
    fullWidth: 'true',
  },
});

/**
 * Value display variants
 */
export const sliderValueVariants = createVariants({
  base: [
    'inline-block',
    'font-medium',
    'text-foreground-secondary',
    'ml-3',
    'tabular-nums', // Monospace numbers for better alignment
  ].join(' '),

  variants: {
    size: {
      sm: 'text-xs',
      md: 'text-sm',
      lg: 'text-base',
    },
  },

  compoundVariants: [],

  defaultVariants: {
    size: 'md',
  },
});

/**
 * Marks container variants
 */
export const sliderMarksVariants = createVariants({
  base: [
    'relative',
    'flex justify-between',
    'mt-1',
    'px-2', // Align with track
  ].join(' '),

  variants: {
    size: {
      sm: 'text-xs',
      md: 'text-sm',
      lg: 'text-base',
    },
  },

  compoundVariants: [],

  defaultVariants: {
    size: 'md',
  },
});

/**
 * Individual mark variants
 */
export const sliderMarkVariants = createVariants({
  base: [
    'absolute',
    'transform -translate-x-1/2',
    'text-foreground-tertiary',
    'text-xs',
    'select-none',
  ].join(' '),

  variants: {
    size: {
      sm: 'text-xs',
      md: 'text-xs',
      lg: 'text-sm',
    },
  },

  compoundVariants: [],

  defaultVariants: {
    size: 'md',
  },
});
