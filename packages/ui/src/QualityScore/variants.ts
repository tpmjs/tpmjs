import { createVariants } from '../system/variants';

/**
 * QualityScore container variant definitions
 */
export const qualityScoreVariants = createVariants({
  base: [
    'inline-flex items-center',
    'font-mono',
  ].join(' '),

  variants: {
    variant: {
      default: 'gap-2',
      badge: 'gap-1.5 px-2 py-1 border border-border rounded-none',
      inline: 'gap-1',
      detailed: 'flex-col items-start gap-2',
    },
    size: {
      sm: 'text-xs',
      md: 'text-sm',
      lg: 'text-base',
    },
  },

  defaultVariants: {
    variant: 'default',
    size: 'md',
  },
});

/**
 * QualityScore circle variant definitions
 */
export const qualityScoreCircleVariants = createVariants({
  base: [
    'relative',
    'flex items-center justify-center',
    'rounded-full',
    'border-2',
    'font-mono font-semibold',
  ].join(' '),

  variants: {
    size: {
      sm: 'w-8 h-8 text-xs',
      md: 'w-10 h-10 text-sm',
      lg: 'w-14 h-14 text-base',
    },
    tier: {
      excellent: 'border-success text-success bg-success/10',
      good: 'border-primary text-primary bg-primary/10',
      fair: 'border-warning text-warning bg-warning/10',
      poor: 'border-error text-error bg-error/10',
    },
  },

  defaultVariants: {
    size: 'md',
    tier: 'fair',
  },
});

/**
 * QualityScore tier label variant definitions
 */
export const qualityScoreTierVariants = createVariants({
  base: [
    'font-mono font-medium',
    'uppercase tracking-wider',
  ].join(' '),

  variants: {
    size: {
      sm: 'text-[10px]',
      md: 'text-xs',
      lg: 'text-sm',
    },
    tier: {
      excellent: 'text-success',
      good: 'text-primary',
      fair: 'text-warning',
      poor: 'text-error',
    },
  },

  defaultVariants: {
    size: 'md',
    tier: 'fair',
  },
});

/**
 * QualityScore bar variant definitions
 */
export const qualityScoreBarVariants = createVariants({
  base: [
    'h-1.5',
    'bg-accent/20',
    'rounded-none',
    'overflow-hidden',
  ].join(' '),

  variants: {
    size: {
      sm: 'w-16',
      md: 'w-20',
      lg: 'w-24',
    },
  },

  defaultVariants: {
    size: 'md',
  },
});

/**
 * QualityScore bar fill variant definitions
 */
export const qualityScoreBarFillVariants = createVariants({
  base: [
    'h-full',
    'transition-all duration-300',
  ].join(' '),

  variants: {
    tier: {
      excellent: 'bg-success',
      good: 'bg-primary',
      fair: 'bg-warning',
      poor: 'bg-error',
    },
  },

  defaultVariants: {
    tier: 'fair',
  },
});

/**
 * QualityScore breakdown container variant definitions
 */
export const qualityScoreBreakdownVariants = createVariants({
  base: [
    'w-full',
    'space-y-1.5',
    'pt-2',
  ].join(' '),

  variants: {},

  defaultVariants: {},
});

/**
 * QualityScore breakdown row variant definitions
 */
export const qualityScoreBreakdownRowVariants = createVariants({
  base: [
    'flex items-center gap-2',
    'text-foreground-muted',
  ].join(' '),

  variants: {
    size: {
      sm: 'text-[10px]',
      md: 'text-xs',
      lg: 'text-sm',
    },
  },

  defaultVariants: {
    size: 'md',
  },
});
