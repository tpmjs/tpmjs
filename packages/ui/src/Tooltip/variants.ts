import { createVariants } from '../system/variants';

/**
 * Tooltip content variant definitions
 */
export const tooltipContentVariants = createVariants({
  base: [
    // Layout
    'absolute',
    'z-[var(--z-tooltip)]',
    'px-2 py-1',
    'max-w-xs',
    // Styling - Sharp corners, inverted colors for contrast
    'bg-foreground text-background',
    'rounded-none',
    // Typography
    'font-mono text-xs',
    // Animation
    'transition-opacity duration-150',
    // Pointer events
    'pointer-events-none',
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
 * Tooltip arrow variant definitions
 */
export const tooltipArrowVariants = createVariants({
  base: [
    'absolute',
    'w-2 h-2',
    'bg-foreground',
    'rotate-45',
  ].join(' '),

  variants: {
    placement: {
      top: 'bottom-[-4px] left-1/2 -translate-x-1/2',
      'top-start': 'bottom-[-4px] left-3',
      'top-end': 'bottom-[-4px] right-3',
      bottom: 'top-[-4px] left-1/2 -translate-x-1/2',
      'bottom-start': 'top-[-4px] left-3',
      'bottom-end': 'top-[-4px] right-3',
      left: 'right-[-4px] top-1/2 -translate-y-1/2',
      'left-start': 'right-[-4px] top-2',
      'left-end': 'right-[-4px] bottom-2',
      right: 'left-[-4px] top-1/2 -translate-y-1/2',
      'right-start': 'left-[-4px] top-2',
      'right-end': 'left-[-4px] bottom-2',
    },
  },

  defaultVariants: {
    placement: 'top',
  },
});
