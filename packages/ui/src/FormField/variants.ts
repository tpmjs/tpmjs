import { createVariants } from '../system/variants';
import {
  formErrorMessage,
  formHelperBase,
  formLabelBase,
  formRequiredIndicator,
} from '../system/formVariants';

/**
 * FormField container variants
 */
export const formFieldVariants = createVariants({
  base: ['flex'].join(' '),

  variants: {
    orientation: {
      vertical: 'flex-col',
      horizontal: 'flex-row items-center gap-4',
    },

    disabled: {
      true: 'opacity-60 cursor-not-allowed',
      false: '',
    },
  },

  compoundVariants: [],

  defaultVariants: {
    orientation: 'vertical',
    disabled: 'false',
  },
});

/**
 * Label variants (reusing form label base)
 */
export const formFieldLabelVariants = createVariants({
  base: [formLabelBase].join(' '),

  variants: {
    state: {
      default: 'text-foreground',
      error: 'text-error',
      success: 'text-success',
    },

    disabled: {
      true: 'cursor-not-allowed',
      false: '',
    },
  },

  compoundVariants: [],

  defaultVariants: {
    state: 'default',
    disabled: 'false',
  },
});

/**
 * Required indicator variants
 */
export const formFieldRequiredVariants = createVariants({
  base: [formRequiredIndicator].join(' '),

  variants: {},

  compoundVariants: [],

  defaultVariants: {},
});

/**
 * Helper text variants
 */
export const formFieldHelperVariants = createVariants({
  base: [formHelperBase].join(' '),

  variants: {
    state: {
      default: 'text-foreground-secondary',
      error: 'text-foreground-secondary',
      success: 'text-success',
    },
  },

  compoundVariants: [],

  defaultVariants: {
    state: 'default',
  },
});

/**
 * Error message variants
 */
export const formFieldErrorVariants = createVariants({
  base: [formErrorMessage].join(' '),

  variants: {},

  compoundVariants: [],

  defaultVariants: {},
});
