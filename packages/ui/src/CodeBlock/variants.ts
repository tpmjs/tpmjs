import { createVariants } from '../system/variants';

/**
 * CodeBlock container variant definitions
 */
export const codeBlockContainerVariants = createVariants({
  base: [
    // Layout
    'relative',
    // Background
    'bg-background',
    // Border
    'border border-border rounded-lg',
    // Overflow
    'overflow-hidden',
  ].join(' '),

  variants: {},

  compoundVariants: [],

  defaultVariants: {},
});

/**
 * CodeBlock code element variant definitions
 */
export const codeBlockCodeVariants = createVariants({
  base: [
    // Display
    'block',
    // Font
    'font-mono',
    // Color
    'text-foreground-secondary',
    // Overflow
    'overflow-x-auto',
    // Whitespace
    'whitespace-pre',
  ].join(' '),

  variants: {
    size: {
      sm: 'text-xs p-3', // 12px font, 12px padding
      md: 'text-sm p-4', // 14px font, 16px padding
      lg: 'text-base p-6', // 16px font, 24px padding
    },
  },

  compoundVariants: [],

  defaultVariants: {
    size: 'md',
  },
});

/**
 * CodeBlock copy button variant definitions
 */
export const codeBlockCopyButtonVariants = createVariants({
  base: [
    // Position - vertically centered on right side
    'absolute right-2 top-1/2 -translate-y-1/2',
    // Display
    'flex items-center justify-center',
    // Size
    'w-7 h-7',
    // Background
    'bg-surface-elevated hover:bg-accent',
    // Border
    'border border-border rounded',
    // Color
    'text-foreground-secondary hover:text-foreground',
    // Cursor
    'cursor-pointer',
    // Transition
    'transition-colors duration-200',
  ].join(' '),

  variants: {},

  compoundVariants: [],

  defaultVariants: {},
});
