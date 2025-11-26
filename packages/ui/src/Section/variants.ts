import { createVariants } from '../system/variants';

/**
 * Section variant definitions
 */
export const sectionVariants = createVariants({
  base: ['relative w-full'].join(' '),

  variants: {
    spacing: {
      none: 'py-0',
      sm: 'py-8',
      md: 'py-16',
      lg: 'py-24',
      xl: 'py-32',
    },

    background: {
      default: 'bg-background',
      surface: 'bg-surface',
      'dotted-grid': 'dotted-grid-background',
      blueprint: 'blueprint-background',
      grid: 'grid-background',
    },

    container: {
      none: '',
      sm: 'max-w-3xl',
      md: 'max-w-5xl',
      lg: 'max-w-7xl',
      xl: 'max-w-[90rem]',
      full: 'max-w-full',
    },

    centered: {
      true: 'mx-auto',
      false: '',
    },
  },

  compoundVariants: [],

  defaultVariants: {
    spacing: 'md',
    background: 'default',
    container: 'none',
    centered: 'false',
  },
});
