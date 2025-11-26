import { createVariants } from '../system/variants';

/**
 * Switch button variant definitions
 */
export const switchVariants = createVariants({
  base: [
    // Reset button styles
    'inline-flex items-center justify-start',
    'cursor-pointer',
    'border-0 p-0',
    // Track styling
    'rounded-full',
    'transition-all duration-200',
    // Focus
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-2',
    // Disabled
    'disabled:cursor-not-allowed disabled:opacity-50',
  ].join(' '),

  variants: {
    state: {
      default: [
        // Unchecked background
        'bg-border',
        // Checked background
        'data-[state=checked]:bg-primary',
        // Hover
        'hover:bg-border-strong',
        'data-[state=checked]:hover:bg-primary',
      ].join(' '),

      error: [
        'bg-border',
        'data-[state=checked]:bg-error',
        'hover:bg-border-strong',
        'data-[state=checked]:hover:bg-error',
        'focus-visible:ring-error/20',
      ].join(' '),

      success: [
        'bg-border',
        'data-[state=checked]:bg-success',
        'hover:bg-border-strong',
        'data-[state=checked]:hover:bg-success',
        'focus-visible:ring-success/20',
      ].join(' '),
    },

    size: {
      sm: 'h-5 w-9',
      md: 'h-6 w-11',
      lg: 'h-7 w-13',
    },

    loading: {
      true: 'cursor-wait pointer-events-none',
      false: '',
    },
  },

  compoundVariants: [],

  defaultVariants: {
    state: 'default',
    size: 'md',
    loading: 'false',
  },
});

/**
 * Switch thumb (sliding circle) variants
 */
export const switchThumbVariants = createVariants({
  base: [
    // Layout
    'inline-block rounded-full',
    'bg-background',
    'shadow-sm',
    // Transition with spring-like easing
    'transition-transform duration-200 ease-in-out',
    // Transform origin for smooth animation
    'will-change-transform',
  ].join(' '),

  variants: {
    size: {
      sm: 'h-4 w-4 data-[state=unchecked]:translate-x-0.5 data-[state=checked]:translate-x-[18px]',
      md: 'h-5 w-5 data-[state=unchecked]:translate-x-0.5 data-[state=checked]:translate-x-[22px]',
      lg: 'h-6 w-6 data-[state=unchecked]:translate-x-0.5 data-[state=checked]:translate-x-[26px]',
    },
  },

  compoundVariants: [],

  defaultVariants: {
    size: 'md',
  },
});

/**
 * Loading spinner variants
 */
export const switchSpinnerVariants = createVariants({
  base: ['absolute inset-0 flex items-center justify-center', 'pointer-events-none'].join(' '),

  variants: {
    size: {
      sm: '',
      md: '',
      lg: '',
    },
  },

  compoundVariants: [],

  defaultVariants: {
    size: 'md',
  },
});

/**
 * Label variants
 */
export const switchLabelVariants = createVariants({
  base: [
    // Typography
    'text-sm font-medium text-foreground',
    // Layout
    'select-none',
    // Cursor
    'cursor-pointer',
    // Disabled
    'peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
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
