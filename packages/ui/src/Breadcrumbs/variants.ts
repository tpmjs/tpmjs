import { createVariants } from '../system/variants';

/**
 * Breadcrumbs container variant definitions
 */
export const breadcrumbsVariants = createVariants({
  base: [
    'flex items-center',
    'font-mono text-sm',
  ].join(' '),

  variants: {},

  defaultVariants: {},
});

/**
 * Breadcrumbs list variant definitions
 */
export const breadcrumbsListVariants = createVariants({
  base: [
    'flex items-center gap-1',
    'flex-wrap',
    'list-none',
    'm-0 p-0',
  ].join(' '),

  variants: {},

  defaultVariants: {},
});

/**
 * Breadcrumb item variant definitions
 */
export const breadcrumbItemVariants = createVariants({
  base: [
    'flex items-center gap-1',
  ].join(' '),

  variants: {
    current: {
      'true': '',
      'false': '',
    },
  },

  defaultVariants: {
    current: 'false',
  },
});

/**
 * Breadcrumb link variant definitions
 */
export const breadcrumbLinkVariants = createVariants({
  base: [
    'text-foreground-muted',
    'hover:text-foreground',
    'transition-colors duration-150',
    'outline-none',
    'focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
    'lowercase',
  ].join(' '),

  variants: {
    current: {
      'true': 'text-foreground font-medium pointer-events-none',
      'false': 'cursor-pointer',
    },
  },

  defaultVariants: {
    current: 'false',
  },
});

/**
 * Breadcrumb separator variant definitions
 */
export const breadcrumbSeparatorVariants = createVariants({
  base: [
    'mx-1',
    'text-foreground-muted',
    'select-none',
    'opacity-60',
  ].join(' '),

  variants: {},

  defaultVariants: {},
});

/**
 * Breadcrumb ellipsis variant definitions
 */
export const breadcrumbEllipsisVariants = createVariants({
  base: [
    'flex items-center justify-center',
    'w-6 h-6',
    'text-foreground-muted',
    'cursor-pointer',
    'hover:text-foreground',
    'transition-colors duration-150',
  ].join(' '),

  variants: {},

  defaultVariants: {},
});

/**
 * Breadcrumb icon variant definitions
 */
export const breadcrumbIconVariants = createVariants({
  base: [
    'flex-shrink-0',
    'w-4 h-4',
    'mr-1',
  ].join(' '),

  variants: {},

  defaultVariants: {},
});
