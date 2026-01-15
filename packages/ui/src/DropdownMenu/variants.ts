import { createVariants } from '../system/variants';

/**
 * Dropdown menu content variant definitions
 */
export const dropdownMenuContentVariants = createVariants({
  base: [
    // Layout
    'absolute',
    'z-[var(--z-dropdown)]',
    'min-w-[10rem]',
    'py-1',
    // Styling - Sharp corners, blueprint aesthetic
    'bg-surface border border-border',
    'rounded-none',
    // Shadow
    'shadow-lg',
    // Animation
    'transition-all duration-150',
  ].join(' '),

  variants: {
    state: {
      entering: 'opacity-0 scale-95',
      entered: 'opacity-100 scale-100',
      exiting: 'opacity-0 scale-95',
    },
  },

  defaultVariants: {
    state: 'entered',
  },
});

/**
 * Dropdown menu item variant definitions
 */
export const dropdownMenuItemVariants = createVariants({
  base: [
    // Layout
    'relative w-full',
    'flex items-center gap-2',
    'px-3 py-2',
    // Typography
    'font-mono text-sm text-left',
    'text-foreground',
    // Interaction
    'cursor-pointer',
    'transition-colors duration-150',
    // Focus
    'outline-none',
    'hover:bg-accent/10',
    'focus-visible:bg-accent/10',
  ].join(' '),

  variants: {
    disabled: {
      'true': 'opacity-50 cursor-not-allowed hover:bg-transparent',
      'false': '',
    },
    destructive: {
      'true': 'text-error hover:bg-error/10 focus-visible:bg-error/10',
      'false': '',
    },
    active: {
      'true': 'bg-accent/10',
      'false': '',
    },
  },

  defaultVariants: {
    disabled: 'false',
    destructive: 'false',
    active: 'false',
  },
});

/**
 * Dropdown menu item icon variant definitions
 */
export const dropdownMenuItemIconVariants = createVariants({
  base: [
    'flex-shrink-0',
    'w-4 h-4',
    'text-foreground-muted',
  ].join(' '),

  variants: {
    destructive: {
      'true': 'text-error',
      'false': '',
    },
  },

  defaultVariants: {
    destructive: 'false',
  },
});

/**
 * Dropdown menu item shortcut variant definitions
 */
export const dropdownMenuItemShortcutVariants = createVariants({
  base: [
    'ml-auto',
    'font-mono text-xs',
    'text-foreground-muted',
    'opacity-60',
  ].join(' '),

  variants: {},

  defaultVariants: {},
});

/**
 * Dropdown menu separator variant definitions
 */
export const dropdownMenuSeparatorVariants = createVariants({
  base: [
    'my-1',
    'h-px',
    'bg-border',
  ].join(' '),

  variants: {},

  defaultVariants: {},
});

/**
 * Dropdown menu label variant definitions
 */
export const dropdownMenuLabelVariants = createVariants({
  base: [
    'px-3 py-2',
    'font-mono text-xs font-semibold',
    'text-foreground-muted',
    'uppercase tracking-wider',
  ].join(' '),

  variants: {},

  defaultVariants: {},
});
