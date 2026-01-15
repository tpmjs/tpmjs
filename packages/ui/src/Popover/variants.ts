import { createVariants } from '../system/variants';

/**
 * Popover content variant definitions
 */
export const popoverContentVariants = createVariants({
  base: [
    // Layout
    'absolute',
    'z-[var(--z-popover)]',
    'min-w-[8rem]',
    'max-w-[20rem]',
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
 * Popover arrow variant definitions
 */
export const popoverArrowVariants = createVariants({
  base: [
    'absolute',
    'w-2 h-2',
    'bg-surface border-border',
    'rotate-45',
  ].join(' '),

  variants: {
    placement: {
      top: 'bottom-[-5px] border-r border-b',
      'top-start': 'bottom-[-5px] border-r border-b left-4',
      'top-end': 'bottom-[-5px] border-r border-b right-4',
      bottom: 'top-[-5px] border-l border-t',
      'bottom-start': 'top-[-5px] border-l border-t left-4',
      'bottom-end': 'top-[-5px] border-l border-t right-4',
      left: 'right-[-5px] border-r border-t',
      'left-start': 'right-[-5px] border-r border-t top-4',
      'left-end': 'right-[-5px] border-r border-t bottom-4',
      right: 'left-[-5px] border-l border-b',
      'right-start': 'left-[-5px] border-l border-b top-4',
      'right-end': 'left-[-5px] border-l border-b bottom-4',
    },
  },

  defaultVariants: {
    placement: 'bottom',
  },
});

/**
 * Popover body variant definitions
 */
export const popoverBodyVariants = createVariants({
  base: [
    'p-3',
    'font-mono text-sm',
    'text-foreground',
  ].join(' '),

  variants: {},

  defaultVariants: {},
});
