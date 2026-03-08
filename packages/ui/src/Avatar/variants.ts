import { createVariants } from '../system/variants';

/**
 * Avatar variant definitions
 * Uses custom variant system for type-safe class composition
 */
export const avatarVariants = createVariants({
  base: [
    // Layout
    'inline-flex items-center justify-center',
    'overflow-hidden shrink-0',
    // Typography - Monospace, uppercase
    'font-mono uppercase select-none',
    // Colors
    'bg-muted text-muted-foreground',
    // Borders & Radius - SHARP CORNERS
    'rounded-none',
  ].join(' '),

  variants: {
    size: {
      xs: 'h-6 w-6 text-[10px]',
      sm: 'h-8 w-8 text-xs',
      md: 'h-10 w-10 text-sm',
      lg: 'h-12 w-12 text-base',
      xl: 'h-16 w-16 text-xl',
    },

    shape: {
      square: 'rounded-none',
      rounded: 'rounded-md',
      circle: 'rounded-full',
    },
  },

  compoundVariants: [],

  defaultVariants: {
    size: 'md',
    shape: 'square',
  },
});
