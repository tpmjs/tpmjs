import type { HTMLAttributes } from 'react';

/**
 * AnimatedCounter component props
 */
export interface AnimatedCounterProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  /**
   * Target number to count to
   */
  value: number;

  /**
   * Duration of the animation in milliseconds
   * @default 2000
   */
  duration?: number;

  /**
   * Number of decimal places to display
   * @default 0
   */
  decimals?: number;

  /**
   * Prefix string (e.g., "$", "#")
   * @default ''
   */
  prefix?: string;

  /**
   * Suffix string (e.g., "K", "M", "%")
   * @default ''
   */
  suffix?: string;

  /**
   * Separator for thousands (e.g., ",")
   * @default ''
   */
  separator?: string;

  /**
   * Whether to start animation when component mounts or enters viewport
   * @default 'viewport'
   */
  startOn?: 'mount' | 'viewport';

  /**
   * Easing function
   * @default 'easeOutExpo'
   */
  easing?: 'linear' | 'easeOutExpo' | 'easeOutQuad';

  /**
   * Size variant
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg' | 'xl';

  /**
   * Whether to use monospace font
   * @default true
   */
  mono?: boolean;
}
