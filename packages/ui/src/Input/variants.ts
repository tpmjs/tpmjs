import { createVariants } from '../system/variants';

/**
 * Input variant definitions
 * Uses custom variant system for type-safe class composition
 */
export const inputVariants = createVariants({
  base: [
    // Layout
    'flex w-full',
    // Typography - Monospace for inputs
    'font-mono',
    // Borders & Radius - SHARP CORNERS
    'rounded-none border',
    // Background - Pure white to stand out
    'bg-surface',
    // Transitions
    'transition-colors duration-150',
    // Focus - Copper accent
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
    // Placeholder
    'placeholder:text-foreground-tertiary',
    // File input
    'file:border-0 file:bg-transparent file:text-sm file:font-medium',
    // Disabled state
    'disabled:cursor-not-allowed disabled:opacity-50',
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
      sm: 'h-9 px-3 py-2 text-sm',
      md: 'h-10 px-3 py-2.5 text-base',
      lg: 'h-11 px-4 py-3 text-lg',
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
