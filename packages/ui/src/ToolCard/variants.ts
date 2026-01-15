import { createVariants } from '../system/variants';

/**
 * ToolCard container variant definitions
 */
export const toolCardVariants = createVariants({
  base: [
    'group',
    'block w-full',
    'border border-border',
    'rounded-none',
    'bg-surface',
    'transition-all duration-150',
    'hover:border-primary/50',
    'hover:shadow-md',
  ].join(' '),

  variants: {
    variant: {
      default: 'p-4',
      compact: 'p-3',
      featured: 'p-6 border-2',
    },
    clickable: {
      'true': 'cursor-pointer',
      'false': '',
    },
  },

  defaultVariants: {
    variant: 'default',
    clickable: 'false',
  },
});

/**
 * ToolCard header variant definitions
 */
export const toolCardHeaderVariants = createVariants({
  base: [
    'flex items-start gap-3',
    'mb-3',
  ].join(' '),

  variants: {
    variant: {
      default: '',
      compact: 'mb-2',
      featured: 'mb-4',
    },
  },

  defaultVariants: {
    variant: 'default',
  },
});

/**
 * ToolCard icon variant definitions
 */
export const toolCardIconVariants = createVariants({
  base: [
    'flex-shrink-0',
    'flex items-center justify-center',
    'bg-accent/10 border border-border',
    'rounded-none',
  ].join(' '),

  variants: {
    variant: {
      default: 'w-10 h-10',
      compact: 'w-8 h-8',
      featured: 'w-12 h-12',
    },
  },

  defaultVariants: {
    variant: 'default',
  },
});

/**
 * ToolCard title variant definitions
 */
export const toolCardTitleVariants = createVariants({
  base: [
    'font-mono font-semibold',
    'text-foreground',
    'lowercase',
    'group-hover:text-primary',
    'transition-colors duration-150',
  ].join(' '),

  variants: {
    variant: {
      default: 'text-sm',
      compact: 'text-sm',
      featured: 'text-base',
    },
  },

  defaultVariants: {
    variant: 'default',
  },
});

/**
 * ToolCard version variant definitions
 */
export const toolCardVersionVariants = createVariants({
  base: [
    'font-mono text-xs',
    'text-foreground-muted',
    'ml-2',
  ].join(' '),

  variants: {},

  defaultVariants: {},
});

/**
 * ToolCard description variant definitions
 */
export const toolCardDescriptionVariants = createVariants({
  base: [
    'font-mono',
    'text-foreground-muted',
    'line-clamp-2',
  ].join(' '),

  variants: {
    variant: {
      default: 'text-sm mb-3',
      compact: 'text-xs mb-2',
      featured: 'text-sm mb-4',
    },
  },

  defaultVariants: {
    variant: 'default',
  },
});

/**
 * ToolCard meta variant definitions
 */
export const toolCardMetaVariants = createVariants({
  base: [
    'flex items-center gap-4',
    'font-mono text-xs',
    'text-foreground-muted',
  ].join(' '),

  variants: {
    variant: {
      default: '',
      compact: 'gap-3',
      featured: 'gap-4',
    },
  },

  defaultVariants: {
    variant: 'default',
  },
});

/**
 * ToolCard meta item variant definitions
 */
export const toolCardMetaItemVariants = createVariants({
  base: [
    'flex items-center gap-1',
  ].join(' '),

  variants: {},

  defaultVariants: {},
});

/**
 * ToolCard tier badge variant definitions
 */
export const toolCardTierBadgeVariants = createVariants({
  base: [
    'inline-flex items-center',
    'px-1.5 py-0.5',
    'font-mono text-[10px] font-medium',
    'uppercase tracking-wider',
    'border rounded-none',
  ].join(' '),

  variants: {
    tier: {
      minimal: 'border-border text-foreground-muted bg-accent/5',
      rich: 'border-primary/50 text-primary bg-primary/5',
    },
  },

  defaultVariants: {
    tier: 'minimal',
  },
});

/**
 * ToolCard official badge variant definitions
 */
export const toolCardOfficialBadgeVariants = createVariants({
  base: [
    'inline-flex items-center gap-1',
    'px-1.5 py-0.5',
    'font-mono text-[10px] font-medium',
    'uppercase tracking-wider',
    'border border-success/50 text-success bg-success/5',
    'rounded-none',
  ].join(' '),

  variants: {},

  defaultVariants: {},
});

/**
 * ToolCard action variant definitions
 */
export const toolCardActionVariants = createVariants({
  base: [
    'mt-3',
    'pt-3',
    'border-t border-border',
  ].join(' '),

  variants: {
    variant: {
      default: '',
      compact: 'mt-2 pt-2',
      featured: 'mt-4 pt-4',
    },
  },

  defaultVariants: {
    variant: 'default',
  },
});
