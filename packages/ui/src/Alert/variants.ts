import { createVariants } from '../system/variants';

export const alertVariants = createVariants({
  base: [
    'relative w-full rounded-none border-2 p-4',
    'font-mono text-sm',
    '[&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:h-4 [&>svg]:w-4',
    '[&>svg+div]:pl-7',
  ].join(' '),

  variants: {
    variant: {
      default: 'bg-background text-foreground border-border',
      info: 'bg-info-light text-foreground border-info [&>svg]:text-info',
      success: 'bg-success-light text-foreground border-success [&>svg]:text-success',
      warning: 'bg-warning-light text-foreground border-warning [&>svg]:text-warning',
      error: 'bg-error-light text-foreground border-error [&>svg]:text-error',
      destructive: 'bg-error-light text-foreground border-error [&>svg]:text-error',
    },
  },

  compoundVariants: [],

  defaultVariants: {
    variant: 'default',
  },
});

export const alertTitleVariants = createVariants({
  base: 'mb-1 font-mono font-semibold leading-tight tracking-tight',
  variants: {},
  defaultVariants: {},
});

export const alertDescriptionVariants = createVariants({
  base: 'text-sm leading-relaxed [&_p]:leading-relaxed',
  variants: {},
  defaultVariants: {},
});
