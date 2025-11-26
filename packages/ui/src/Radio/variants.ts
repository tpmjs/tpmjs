import { createVariants } from '../system/variants';
import { formControlBase } from '../system/formVariants';

/**
 * Radio variant definitions
 * Uses custom variant system for type-safe class composition
 */
export const radioVariants = createVariants({
  base: [
    formControlBase,
    // Layout - hidden input, styled via custom UI
    'peer sr-only',
  ].join(' '),

  variants: {
    state: {
      default: '',
      error: '',
      success: '',
    },

    size: {
      sm: '',
      md: '',
      lg: '',
    },
  },

  compoundVariants: [],

  defaultVariants: {
    state: 'default',
    size: 'md',
  },
});

/**
 * Custom radio UI (visual representation)
 */
export const radioUIVariants = createVariants({
  base: [
    // Layout
    'relative inline-flex items-center justify-center flex-shrink-0',
    // Border & Background (circular)
    'rounded-full border-2 border-border',
    'bg-background',
    // Transitions
    'transition-all duration-200',
    // Hover state
    'peer-hover:border-border-strong',
    // Focus state (via peer)
    'peer-focus-visible:ring-2 peer-focus-visible:ring-primary/20 peer-focus-visible:ring-offset-2',
    // Checked state
    'peer-checked:border-primary',
    // Disabled state
    'peer-disabled:cursor-not-allowed peer-disabled:opacity-50 peer-disabled:hover:border-border',
  ].join(' '),

  variants: {
    state: {
      default: [
        'border-border',
        'peer-hover:border-border-strong',
        'peer-focus-visible:ring-primary/20',
      ].join(' '),

      error: [
        'border-error',
        'peer-hover:border-error',
        'peer-focus-visible:ring-error/20',
        'peer-checked:border-error',
      ].join(' '),

      success: [
        'border-success',
        'peer-hover:border-success',
        'peer-focus-visible:ring-success/20',
        'peer-checked:border-success',
      ].join(' '),
    },

    size: {
      sm: 'h-4 w-4',
      md: 'h-5 w-5',
      lg: 'h-6 w-6',
    },
  },

  compoundVariants: [],

  defaultVariants: {
    state: 'default',
    size: 'md',
  },
});

/**
 * Inner dot variants (shown when checked)
 */
export const radioDotVariants = createVariants({
  base: [
    // Layout
    'absolute rounded-full',
    // Hidden by default
    'opacity-0 scale-0',
    // Transitions
    'transition-all duration-200',
    // Visible when checked
    'peer-checked:opacity-100 peer-checked:scale-100',
    // Background color
    'bg-primary',
  ].join(' '),

  variants: {
    state: {
      default: 'bg-primary',
      error: 'bg-error',
      success: 'bg-success',
    },

    size: {
      sm: 'h-1.5 w-1.5',
      md: 'h-2 w-2',
      lg: 'h-2.5 w-2.5',
    },
  },

  compoundVariants: [],

  defaultVariants: {
    state: 'default',
    size: 'md',
  },
});

/**
 * Label variants
 */
export const radioLabelVariants = createVariants({
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

/**
 * RadioGroup container variants
 */
export const radioGroupVariants = createVariants({
  base: ['flex'].join(' '),

  variants: {
    orientation: {
      horizontal: 'flex-row gap-4',
      vertical: 'flex-col gap-2.5',
    },
  },

  compoundVariants: [],

  defaultVariants: {
    orientation: 'vertical',
  },
});
