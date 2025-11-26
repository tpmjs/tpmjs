import { createVariants } from '../system/variants';
import { formInputBase } from '../system/formVariants';

/**
 * Select variant definitions
 */
export const selectVariants = createVariants({
  base: [
    formInputBase,
    // Custom appearance for select
    'appearance-none',
    'cursor-pointer',
    // Padding for dropdown icon
    'pr-10',
    // Loading state
    'data-[loading=true]:cursor-wait data-[loading=true]:opacity-70',
  ].join(' '),

  variants: {
    state: {
      default: [
        'border-border text-foreground',
        'hover:border-border-strong',
        'focus:border-primary',
      ].join(' '),

      error: [
        'border-error text-foreground',
        'hover:border-error',
        'focus:border-error',
        'focus:ring-error/20',
      ].join(' '),

      success: [
        'border-success text-foreground',
        'hover:border-success',
        'focus:border-success',
        'focus:ring-success/20',
      ].join(' '),
    },

    size: {
      sm: 'h-9 px-3 py-2 text-sm pr-8',
      md: 'h-10 px-3 py-2.5 text-base pr-10',
      lg: 'h-11 px-4 py-3 text-lg pr-12',
    },

    fullWidth: {
      true: 'w-full',
      false: 'w-auto',
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
 * Select icon (chevron down) variants
 */
export const selectIconVariants = createVariants({
  base: [
    // Positioning
    'absolute right-0 top-0 bottom-0',
    'flex items-center justify-center',
    'pointer-events-none',
    // Color
    'text-foreground-tertiary',
  ].join(' '),

  variants: {
    size: {
      sm: 'w-8',
      md: 'w-10',
      lg: 'w-12',
    },
  },

  compoundVariants: [],

  defaultVariants: {
    size: 'md',
  },
});

/**
 * Loading spinner container variants
 */
export const selectSpinnerVariants = createVariants({
  base: [
    // Positioning
    'absolute right-0 top-0 bottom-0',
    'flex items-center justify-center',
    'pointer-events-none',
    // Color
    'text-foreground-secondary',
  ].join(' '),

  variants: {
    size: {
      sm: 'w-8',
      md: 'w-10',
      lg: 'w-12',
    },
  },

  compoundVariants: [],

  defaultVariants: {
    size: 'md',
  },
});
