import { createVariants } from '../system/variants';

/**
 * Icon variant definitions
 * Uses custom variant system for type-safe class composition
 */
export const iconVariants = createVariants({
  base: [
    // Display
    'inline-block',
    // Fill
    'fill-current',
  ].join(' '),

  variants: {
    size: {
      sm: 'w-4 h-4', // 16px
      md: 'w-5 h-5', // 20px
      lg: 'w-6 h-6', // 24px
    },
  },

  compoundVariants: [],

  defaultVariants: {
    size: 'md',
  },
});
