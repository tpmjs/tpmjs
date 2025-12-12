import { formControlBase } from '../system/formVariants';
import { createVariants } from '../system/variants';

/**
 * Checkbox variant definitions
 * Uses custom variant system for type-safe class composition
 */
export const checkboxVariants = createVariants({
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
 * Custom checkbox UI (visual representation)
 */
export const checkboxUIVariants = createVariants({
  base: [
    // Layout
    'relative inline-flex items-center justify-center flex-shrink-0',
    // Border & Background
    'rounded-sm border-2 border-border',
    'bg-background',
    // Transitions
    'transition-all duration-200',
    // Hover state
    'peer-hover:border-border-strong',
    // Focus state (via peer)
    'peer-focus-visible:ring-2 peer-focus-visible:ring-primary/20 peer-focus-visible:ring-offset-2',
    // Checked state
    'peer-checked:bg-primary peer-checked:border-primary',
    // Indeterminate state (custom data attribute)
    'peer-data-[indeterminate=true]:bg-primary peer-data-[indeterminate=true]:border-primary',
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
        'peer-checked:bg-error peer-checked:border-error',
        'peer-data-[indeterminate=true]:bg-error peer-data-[indeterminate=true]:border-error',
      ].join(' '),

      success: [
        'border-success',
        'peer-hover:border-success',
        'peer-focus-visible:ring-success/20',
        'peer-checked:bg-success peer-checked:border-success',
        'peer-data-[indeterminate=true]:bg-success peer-data-[indeterminate=true]:border-success',
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
 * Checkmark icon variants
 * Note: Uses group-[] selectors because the SVG is nested inside the checkboxUI span,
 * not a direct sibling of the input. The checkboxUI span has peer-checked classes.
 */
export const checkmarkVariants = createVariants({
  base: [
    // Positioning
    'absolute inset-0',
    // Hidden by default, visible when parent has peer-checked state
    'opacity-0 scale-0',
    // Transitions
    'transition-all duration-200',
    // Color
    'text-primary-foreground',
  ].join(' '),

  variants: {
    size: {
      sm: 'h-4 w-4',
      md: 'h-5 w-5',
      lg: 'h-6 w-6',
    },
  },

  compoundVariants: [],

  defaultVariants: {
    size: 'md',
  },
});

/**
 * Indeterminate line variants
 */
export const indeterminateVariants = createVariants({
  base: [
    // Positioning
    'absolute inset-0',
    // Hidden by default
    'opacity-0 scale-0',
    // Transitions
    'transition-all duration-200',
    // Visible when indeterminate
    'peer-data-[indeterminate=true]:opacity-100 peer-data-[indeterminate=true]:scale-100',
    // Hidden when checked (checked takes precedence)
    'peer-checked:opacity-0 peer-checked:scale-0',
    // Color
    'text-primary-foreground',
  ].join(' '),

  variants: {
    size: {
      sm: 'h-4 w-4',
      md: 'h-5 w-5',
      lg: 'h-6 w-6',
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
export const checkboxLabelVariants = createVariants({
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
