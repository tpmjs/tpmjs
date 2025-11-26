import { createVariants } from '../system/variants';

/**
 * Tabs container variant definitions
 */
export const tabsContainerVariants = createVariants({
  base: [
    // Layout
    'flex items-center',
    // Overflow
    'overflow-x-auto',
  ].join(' '),

  variants: {
    size: {
      sm: 'gap-1',
      md: 'gap-1',
      lg: 'gap-1',
    },
    variant: {
      default: 'border-b border-border',
      blueprint: 'border-b border-dotted border-border',
    },
  },

  compoundVariants: [],

  defaultVariants: {
    size: 'md',
    variant: 'default',
  },
});

/**
 * Tab button variant definitions
 */
export const tabButtonVariants = createVariants({
  base: [
    // Display
    'inline-flex items-center gap-2',
    // Font
    'font-medium whitespace-nowrap',
    // Transition
    'transition-colors duration-200',
    // Cursor
    'cursor-pointer',
  ].join(' '),

  variants: {
    size: {
      sm: 'text-sm px-3 py-2',
      md: 'text-base px-4 py-3',
      lg: 'text-lg px-6 py-4',
    },
    active: {
      true: 'text-foreground border-primary',
      false:
        'text-foreground-secondary border-transparent hover:text-foreground hover:border-border-strong',
    },
    variant: {
      default: 'border-b-2',
      blueprint: 'border-b-2 border-dotted',
    },
  },

  compoundVariants: [],

  defaultVariants: {
    size: 'md',
    active: 'false',
    variant: 'default',
  },
});

/**
 * Tab count badge variant definitions
 */
export const tabCountVariants = createVariants({
  base: [
    // Display
    'inline-flex items-center justify-center',
    // Size
    'min-w-[1.25rem] h-5',
    // Padding
    'px-1.5',
    // Font
    'text-xs font-medium tabular-nums',
    // Background
    'bg-surface-elevated',
    // Border
    'rounded-full',
  ].join(' '),

  variants: {
    active: {
      true: 'text-foreground',
      false: 'text-foreground-tertiary',
    },
  },

  compoundVariants: [],

  defaultVariants: {
    active: 'false',
  },
});
