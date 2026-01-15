import { createVariants } from '../system/variants';

/**
 * Toast container variant definitions (holds all toasts)
 */
export const toastContainerVariants = createVariants({
  base: [
    'fixed',
    'z-[var(--z-toast)]',
    'flex flex-col gap-3',
    'p-4',
    'pointer-events-none',
    'max-h-screen overflow-hidden',
  ].join(' '),

  variants: {
    position: {
      'top-left': 'top-0 left-0 items-start',
      'top-center': 'top-0 left-1/2 -translate-x-1/2 items-center',
      'top-right': 'top-0 right-0 items-end',
      'bottom-left': 'bottom-0 left-0 items-start',
      'bottom-center': 'bottom-0 left-1/2 -translate-x-1/2 items-center',
      'bottom-right': 'bottom-0 right-0 items-end',
    },
  },

  defaultVariants: {
    position: 'bottom-right',
  },
});

/**
 * Toast variant definitions
 */
export const toastVariants = createVariants({
  base: [
    // Layout
    'relative w-full max-w-sm',
    'flex items-start gap-3',
    'p-4',
    // Styling - Sharp corners, blueprint aesthetic
    'bg-surface border border-border',
    'rounded-none',
    // Shadow
    'shadow-lg',
    // Animation
    'transition-all duration-200',
    // Pointer events
    'pointer-events-auto',
  ].join(' '),

  variants: {
    variant: {
      default: 'border-border',
      success: 'border-success bg-success/5',
      error: 'border-error bg-error/5',
      warning: 'border-warning bg-warning/5',
      info: 'border-primary bg-primary/5',
    },
    state: {
      entering: 'opacity-0 translate-x-4',
      entered: 'opacity-100 translate-x-0',
      exiting: 'opacity-0 translate-x-4',
    },
  },

  defaultVariants: {
    variant: 'default',
    state: 'entered',
  },
});

/**
 * Toast icon variant definitions
 */
export const toastIconVariants = createVariants({
  base: ['flex-shrink-0', 'mt-0.5'].join(' '),

  variants: {
    variant: {
      default: 'text-foreground-muted',
      success: 'text-success',
      error: 'text-error',
      warning: 'text-warning',
      info: 'text-primary',
    },
  },

  defaultVariants: {
    variant: 'default',
  },
});

/**
 * Toast content variant definitions
 */
export const toastContentVariants = createVariants({
  base: ['flex-1 min-w-0'].join(' '),

  variants: {},

  defaultVariants: {},
});

/**
 * Toast title variant definitions
 */
export const toastTitleVariants = createVariants({
  base: [
    'font-mono font-semibold text-sm',
    'text-foreground',
    'lowercase',
  ].join(' '),

  variants: {},

  defaultVariants: {},
});

/**
 * Toast description variant definitions
 */
export const toastDescriptionVariants = createVariants({
  base: [
    'font-mono text-sm',
    'text-foreground-muted',
    'mt-1',
  ].join(' '),

  variants: {},

  defaultVariants: {},
});

/**
 * Toast close button variant definitions
 */
export const toastCloseButtonVariants = createVariants({
  base: [
    'flex-shrink-0',
    'p-1 -m-1',
    'text-foreground-muted',
    'hover:text-foreground hover:bg-accent/10',
    'transition-colors duration-150',
    'rounded-none',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
  ].join(' '),

  variants: {},

  defaultVariants: {},
});

/**
 * Toast action variant definitions
 */
export const toastActionVariants = createVariants({
  base: [
    'mt-2',
    'flex gap-2',
  ].join(' '),

  variants: {},

  defaultVariants: {},
});
