import { createVariants } from '../system/variants';

/**
 * Accordion container variant definitions
 */
export const accordionVariants = createVariants({
  base: [
    'w-full',
  ].join(' '),

  variants: {
    variant: {
      default: '',
      bordered: 'border border-border rounded-none',
      separated: 'space-y-2',
    },
  },

  defaultVariants: {
    variant: 'default',
  },
});

/**
 * Accordion item variant definitions
 */
export const accordionItemVariants = createVariants({
  base: [
    'w-full',
  ].join(' '),

  variants: {
    variant: {
      default: 'border-b border-border last:border-b-0',
      bordered: 'border-b border-border last:border-b-0',
      separated: 'border border-border rounded-none',
    },
  },

  defaultVariants: {
    variant: 'default',
  },
});

/**
 * Accordion trigger variant definitions
 */
export const accordionTriggerVariants = createVariants({
  base: [
    // Layout
    'w-full',
    'flex items-center justify-between gap-4',
    'py-4 px-4',
    // Typography
    'font-mono text-sm font-medium',
    'text-foreground',
    'text-left',
    // Interaction
    'cursor-pointer',
    'transition-colors duration-150',
    // Focus
    'outline-none',
    'focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset',
    // States
    'hover:bg-accent/5',
  ].join(' '),

  variants: {
    disabled: {
      'true': 'opacity-50 cursor-not-allowed hover:bg-transparent',
      'false': '',
    },
  },

  defaultVariants: {
    disabled: 'false',
  },
});

/**
 * Accordion trigger icon variant definitions
 */
export const accordionTriggerIconVariants = createVariants({
  base: [
    'flex-shrink-0',
    'text-foreground-muted',
    'transition-transform duration-200',
  ].join(' '),

  variants: {
    expanded: {
      'true': 'rotate-180',
      'false': 'rotate-0',
    },
  },

  defaultVariants: {
    expanded: 'false',
  },
});

/**
 * Accordion content variant definitions
 */
export const accordionContentVariants = createVariants({
  base: [
    'overflow-hidden',
    'transition-all duration-200 ease-in-out',
  ].join(' '),

  variants: {
    expanded: {
      'true': 'max-h-[1000px] opacity-100',
      'false': 'max-h-0 opacity-0',
    },
  },

  defaultVariants: {
    expanded: 'false',
  },
});

/**
 * Accordion content inner variant definitions
 */
export const accordionContentInnerVariants = createVariants({
  base: [
    'px-4 pb-4',
    'font-mono text-sm',
    'text-foreground-muted',
  ].join(' '),

  variants: {},

  defaultVariants: {},
});
