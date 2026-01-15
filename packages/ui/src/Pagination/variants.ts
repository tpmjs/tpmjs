import { createVariants } from '../system/variants';

/**
 * Pagination container variant definitions
 */
export const paginationVariants = createVariants({
  base: [
    'flex items-center gap-1',
    'font-mono',
  ].join(' '),

  variants: {
    size: {
      sm: 'text-xs',
      md: 'text-sm',
      lg: 'text-base',
    },
  },

  defaultVariants: {
    size: 'md',
  },
});

/**
 * Pagination item variant definitions
 */
export const paginationItemVariants = createVariants({
  base: [
    // Layout
    'inline-flex items-center justify-center',
    'font-mono',
    // Styling - Sharp corners
    'border border-transparent',
    'rounded-none',
    // Interaction
    'cursor-pointer',
    'transition-all duration-150',
    // Focus
    'outline-none',
    'focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
  ].join(' '),

  variants: {
    size: {
      sm: 'h-7 min-w-7 px-2 text-xs',
      md: 'h-9 min-w-9 px-3 text-sm',
      lg: 'h-11 min-w-11 px-4 text-base',
    },
    active: {
      'true': 'bg-primary text-primary-foreground border-primary',
      'false': 'text-foreground-muted hover:text-foreground hover:bg-accent/10 hover:border-border',
    },
    disabled: {
      'true': 'opacity-50 cursor-not-allowed pointer-events-none',
      'false': '',
    },
  },

  defaultVariants: {
    size: 'md',
    active: 'false',
    disabled: 'false',
  },
});

/**
 * Pagination nav button variant definitions
 */
export const paginationNavButtonVariants = createVariants({
  base: [
    // Layout
    'inline-flex items-center justify-center gap-1',
    'font-mono',
    // Styling
    'border border-border',
    'rounded-none',
    // Interaction
    'cursor-pointer',
    'transition-all duration-150',
    // Focus
    'outline-none',
    'focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
    // States
    'text-foreground-muted',
    'hover:text-foreground hover:bg-accent/10',
  ].join(' '),

  variants: {
    size: {
      sm: 'h-7 px-2 text-xs',
      md: 'h-9 px-3 text-sm',
      lg: 'h-11 px-4 text-base',
    },
    disabled: {
      'true': 'opacity-50 cursor-not-allowed pointer-events-none',
      'false': '',
    },
  },

  defaultVariants: {
    size: 'md',
    disabled: 'false',
  },
});

/**
 * Pagination ellipsis variant definitions
 */
export const paginationEllipsisVariants = createVariants({
  base: [
    'inline-flex items-center justify-center',
    'text-foreground-muted',
    'select-none',
  ].join(' '),

  variants: {
    size: {
      sm: 'h-7 w-7 text-xs',
      md: 'h-9 w-9 text-sm',
      lg: 'h-11 w-11 text-base',
    },
  },

  defaultVariants: {
    size: 'md',
  },
});

/**
 * Pagination info variant definitions (for showing "Page X of Y")
 */
export const paginationInfoVariants = createVariants({
  base: [
    'text-foreground-muted',
    'font-mono',
    'mx-2',
  ].join(' '),

  variants: {
    size: {
      sm: 'text-xs',
      md: 'text-sm',
      lg: 'text-base',
    },
  },

  defaultVariants: {
    size: 'md',
  },
});
