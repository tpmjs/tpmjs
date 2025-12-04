import { createVariants } from '../system/variants';

/**
 * Textarea variant definitions
 * Uses custom variant system for type-safe class composition
 */
export const textareaVariants = createVariants({
  base: [
    // Layout
    'flex w-full',
    // Typography
    'font-sans',
    // Borders & Radius
    'rounded-md border',
    // Background - Pure white to stand out
    'bg-surface',
    // Transitions
    'transition-base',
    // Focus
    'focus-ring',
    // Placeholder
    'placeholder:text-foreground-tertiary',
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
      sm: 'min-h-20 px-3 py-2 text-sm',
      md: 'min-h-32 px-3 py-2.5 text-base',
      lg: 'min-h-40 px-4 py-3 text-lg',
    },

    fullWidth: {
      true: 'w-full',
      false: 'w-auto',
    },

    resize: {
      none: 'resize-none',
      vertical: 'resize-y',
      horizontal: 'resize-x',
      both: 'resize',
    },
  },

  compoundVariants: [],

  defaultVariants: {
    state: 'default',
    size: 'md',
    fullWidth: 'true',
    resize: 'vertical',
  },
});
