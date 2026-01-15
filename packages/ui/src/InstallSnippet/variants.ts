import { createVariants } from '../system/variants';

/**
 * InstallSnippet container variant definitions
 */
export const installSnippetVariants = createVariants({
  base: [
    'w-full',
    'border border-border',
    'rounded-none',
    'overflow-hidden',
  ].join(' '),

  variants: {
    variant: {
      default: 'bg-surface',
      minimal: 'border-0 bg-transparent',
      dark: 'bg-foreground border-foreground',
    },
  },

  defaultVariants: {
    variant: 'default',
  },
});

/**
 * InstallSnippet tabs variant definitions
 */
export const installSnippetTabsVariants = createVariants({
  base: [
    'flex items-center',
    'border-b border-border',
    'px-1',
    'gap-0',
  ].join(' '),

  variants: {
    variant: {
      default: 'bg-surface',
      minimal: 'bg-transparent border-0',
      dark: 'bg-foreground border-foreground/20',
    },
  },

  defaultVariants: {
    variant: 'default',
  },
});

/**
 * InstallSnippet tab variant definitions
 */
export const installSnippetTabVariants = createVariants({
  base: [
    'px-3 py-2',
    'font-mono text-xs',
    'border-b-2 border-transparent',
    '-mb-px',
    'cursor-pointer',
    'transition-colors duration-150',
  ].join(' '),

  variants: {
    variant: {
      default: 'text-foreground-muted hover:text-foreground',
      minimal: 'text-foreground-muted hover:text-foreground',
      dark: 'text-background/60 hover:text-background',
    },
    active: {
      'true': '',
      'false': '',
    },
  },

  defaultVariants: {
    variant: 'default',
    active: 'false',
  },

  compoundVariants: [
    { conditions: { variant: 'default', active: 'true' }, className: 'text-foreground border-primary' },
    { conditions: { variant: 'minimal', active: 'true' }, className: 'text-foreground border-primary' },
    { conditions: { variant: 'dark', active: 'true' }, className: 'text-background border-background' },
  ],
});

/**
 * InstallSnippet code area variant definitions
 */
export const installSnippetCodeVariants = createVariants({
  base: [
    'flex items-center justify-between',
    'px-4 py-3',
    'font-mono text-sm',
    'overflow-x-auto',
  ].join(' '),

  variants: {
    variant: {
      default: 'text-foreground',
      minimal: 'text-foreground',
      dark: 'text-background',
    },
  },

  defaultVariants: {
    variant: 'default',
  },
});

/**
 * InstallSnippet copy button variant definitions
 */
export const installSnippetCopyButtonVariants = createVariants({
  base: [
    'flex-shrink-0',
    'p-1.5',
    '-m-1',
    'ml-3',
    'rounded-none',
    'transition-colors duration-150',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
  ].join(' '),

  variants: {
    variant: {
      default: 'text-foreground-muted hover:text-foreground hover:bg-accent/10',
      minimal: 'text-foreground-muted hover:text-foreground hover:bg-accent/10',
      dark: 'text-background/60 hover:text-background hover:bg-background/10',
    },
    copied: {
      'true': '',
      'false': '',
    },
  },

  defaultVariants: {
    variant: 'default',
    copied: 'false',
  },

  compoundVariants: [
    { conditions: { variant: 'default', copied: 'true' }, className: 'text-success' },
    { conditions: { variant: 'minimal', copied: 'true' }, className: 'text-success' },
    { conditions: { variant: 'dark', copied: 'true' }, className: 'text-success' },
  ],
});
