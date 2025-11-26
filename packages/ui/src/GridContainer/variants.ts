import { createVariants } from '../system/variants';

/**
 * GridContainer variant definitions
 */
export const gridContainerVariants = createVariants({
  base: ['grid w-full'].join(' '),

  variants: {
    columns: {
      auto: '',
      1: 'grid-cols-1',
      2: 'grid-cols-1 md:grid-cols-2',
      3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
      4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
      5: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-5',
      6: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6',
      12: 'grid-cols-4 md:grid-cols-6 lg:grid-cols-12',
    },

    gap: {
      none: 'gap-0',
      sm: 'gap-4',
      md: 'gap-6',
      lg: 'gap-8',
      xl: 'gap-12',
    },

    responsive: {
      responsive: '',
      fixed: '',
    },

    align: {
      start: 'items-start',
      center: 'items-center',
      end: 'items-end',
      stretch: 'items-stretch',
    },

    justify: {
      start: 'justify-items-start',
      center: 'justify-items-center',
      end: 'justify-items-end',
      between: 'justify-items-between',
      around: 'justify-items-around',
      evenly: 'justify-items-evenly',
    },
  },

  compoundVariants: [
    {
      conditions: {
        columns: 'auto',
        responsive: 'responsive',
      },
      className: 'grid-cols-[repeat(auto-fit,minmax(250px,1fr))]',
    },
    {
      conditions: {
        columns: 'auto',
        responsive: 'fixed',
      },
      className: 'grid-cols-[repeat(auto-fill,minmax(250px,1fr))]',
    },
    // Fixed columns don't use responsive breakpoints
    {
      conditions: {
        columns: 2,
        responsive: 'fixed',
      },
      className: 'grid-cols-2',
    },
    {
      conditions: {
        columns: 3,
        responsive: 'fixed',
      },
      className: 'grid-cols-3',
    },
    {
      conditions: {
        columns: 4,
        responsive: 'fixed',
      },
      className: 'grid-cols-4',
    },
    {
      conditions: {
        columns: 5,
        responsive: 'fixed',
      },
      className: 'grid-cols-5',
    },
    {
      conditions: {
        columns: 6,
        responsive: 'fixed',
      },
      className: 'grid-cols-6',
    },
    {
      conditions: {
        columns: 12,
        responsive: 'fixed',
      },
      className: 'grid-cols-12',
    },
  ],

  defaultVariants: {
    columns: 'auto',
    gap: 'md',
    responsive: 'responsive',
    align: 'stretch',
    justify: 'start',
  },
});
