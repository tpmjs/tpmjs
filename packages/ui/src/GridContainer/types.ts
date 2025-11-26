import type { HTMLAttributes } from 'react';

/**
 * GridContainer component props
 */
export interface GridContainerProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Number of columns in the grid
   * @default 'auto'
   */
  columns?: 'auto' | 1 | 2 | 3 | 4 | 5 | 6 | 12;

  /**
   * Gap between grid items
   * @default 'md'
   */
  gap?: 'none' | 'sm' | 'md' | 'lg' | 'xl';

  /**
   * Responsive breakpoint behavior
   * @default 'responsive'
   */
  responsive?: 'responsive' | 'fixed';

  /**
   * Align items vertically
   * @default 'stretch'
   */
  align?: 'start' | 'center' | 'end' | 'stretch';

  /**
   * Justify items horizontally
   * @default 'start'
   */
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
}

/**
 * GridContainer ref type
 */
export type GridContainerRef = HTMLDivElement;
