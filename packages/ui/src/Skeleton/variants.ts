import { createVariants } from '../system/variants';

/**
 * Skeleton base variant definitions
 */
export const skeletonVariants = createVariants({
  base: [
    'bg-accent/20',
  ].join(' '),

  variants: {
    variant: {
      text: 'h-4 rounded-none',
      circular: 'rounded-full',
      rectangular: 'rounded-none',
      rounded: 'rounded-sm',
    },
    animation: {
      pulse: 'animate-pulse',
      wave: 'skeleton-wave',
      none: '',
    },
  },

  defaultVariants: {
    variant: 'text',
    animation: 'pulse',
  },
});

/**
 * Skeleton text container variant definitions
 */
export const skeletonTextContainerVariants = createVariants({
  base: [
    'flex flex-col',
  ].join(' '),

  variants: {},

  defaultVariants: {},
});

/**
 * Skeleton avatar variant definitions
 */
export const skeletonAvatarVariants = createVariants({
  base: [
    'rounded-full',
    'bg-accent/20',
    'flex-shrink-0',
  ].join(' '),

  variants: {
    size: {
      sm: 'w-8 h-8',
      md: 'w-10 h-10',
      lg: 'w-12 h-12',
      xl: 'w-16 h-16',
    },
    animation: {
      pulse: 'animate-pulse',
      wave: 'skeleton-wave',
      none: '',
    },
  },

  defaultVariants: {
    size: 'md',
    animation: 'pulse',
  },
});

/**
 * Skeleton card variant definitions
 */
export const skeletonCardVariants = createVariants({
  base: [
    'border border-border',
    'rounded-none',
    'p-4',
    'space-y-4',
  ].join(' '),

  variants: {},

  defaultVariants: {},
});

/**
 * Skeleton card image variant definitions
 */
export const skeletonCardImageVariants = createVariants({
  base: [
    'w-full h-32',
    'bg-accent/20',
    'rounded-none',
  ].join(' '),

  variants: {
    animation: {
      pulse: 'animate-pulse',
      wave: 'skeleton-wave',
      none: '',
    },
  },

  defaultVariants: {
    animation: 'pulse',
  },
});
