import type { InputHTMLAttributes } from 'react';

/**
 * Slider component props
 */
export interface SliderProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  /**
   * Minimum value
   * @default 0
   */
  min?: number;

  /**
   * Maximum value
   * @default 100
   */
  max?: number;

  /**
   * Step increment
   * @default 1
   */
  step?: number;

  /**
   * Visual state of the slider
   * @default 'default'
   */
  state?: 'default' | 'error' | 'success';

  /**
   * Size variant
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';

  /**
   * Whether to show the current value
   * @default false
   */
  showValue?: boolean;

  /**
   * Whether to show tick marks at step intervals
   * @default false
   */
  showMarks?: boolean;

  /**
   * Custom marks at specific values
   */
  marks?: Array<{
    value: number;
    label?: string;
  }>;

  /**
   * Whether slider should take full width
   * @default true
   */
  fullWidth?: boolean;
}

/**
 * Slider ref type
 */
export type SliderRef = HTMLInputElement;
