import { createVariants } from '../system/variants';

/**
 * Modal backdrop variant definitions
 */
export const modalBackdropVariants = createVariants({
  base: [
    'fixed inset-0',
    'bg-foreground/80',
    'backdrop-blur-sm',
    'z-[var(--z-modal-backdrop)]',
    'transition-opacity duration-200',
  ].join(' '),

  variants: {
    state: {
      entering: 'opacity-0',
      entered: 'opacity-100',
      exiting: 'opacity-0',
    },
  },

  defaultVariants: {
    state: 'entered',
  },
});

/**
 * Modal container variant definitions
 */
export const modalContainerVariants = createVariants({
  base: [
    'fixed inset-0',
    'z-[var(--z-modal)]',
    'flex items-center justify-center',
    'p-4',
    'overflow-y-auto',
  ].join(' '),

  variants: {},

  defaultVariants: {},
});

/**
 * Modal panel variant definitions
 */
export const modalPanelVariants = createVariants({
  base: [
    // Layout
    'relative w-full',
    'flex flex-col',
    'max-h-[calc(100vh-2rem)]',
    // Styling - Sharp corners, blueprint aesthetic
    'bg-surface border border-border',
    'rounded-none',
    // Shadow
    'shadow-lg',
    // Animation
    'transition-all duration-200',
  ].join(' '),

  variants: {
    size: {
      sm: 'max-w-sm',
      md: 'max-w-md',
      lg: 'max-w-lg',
      xl: 'max-w-xl',
      full: 'max-w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)]',
    },
    state: {
      entering: 'opacity-0 scale-95 translate-y-4',
      entered: 'opacity-100 scale-100 translate-y-0',
      exiting: 'opacity-0 scale-95 translate-y-4',
    },
  },

  defaultVariants: {
    size: 'md',
    state: 'entered',
  },
});

/**
 * Modal header variant definitions
 */
export const modalHeaderVariants = createVariants({
  base: [
    'flex items-center justify-between',
    'px-6 py-4',
    'border-b border-border',
    'bg-surface',
  ].join(' '),

  variants: {},

  defaultVariants: {},
});

/**
 * Modal body variant definitions
 */
export const modalBodyVariants = createVariants({
  base: [
    'flex-1',
    'px-6 py-4',
    'overflow-y-auto',
  ].join(' '),

  variants: {},

  defaultVariants: {},
});

/**
 * Modal footer variant definitions
 */
export const modalFooterVariants = createVariants({
  base: [
    'flex items-center justify-end gap-3',
    'px-6 py-4',
    'border-t border-border',
    'bg-surface',
  ].join(' '),

  variants: {},

  defaultVariants: {},
});

/**
 * Modal title variant definitions
 */
export const modalTitleVariants = createVariants({
  base: [
    'font-mono font-semibold text-lg',
    'text-foreground',
    'lowercase',
  ].join(' '),

  variants: {},

  defaultVariants: {},
});

/**
 * Modal close button variant definitions
 */
export const modalCloseButtonVariants = createVariants({
  base: [
    'p-2 -m-2',
    'text-foreground-muted',
    'hover:text-foreground hover:bg-accent/10',
    'transition-colors duration-150',
    'rounded-none',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
  ].join(' '),

  variants: {},

  defaultVariants: {},
});
