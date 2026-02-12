import type { HTMLAttributes } from 'react';

/**
 * StatCard component props
 */
export interface StatCardProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * The statistic value (number)
   */
  value: number;

  /**
   * Label describing the statistic
   */
  label: string;

  /**
   * Optional subtext/description
   */
  subtext?: string;

  /**
   * Value prefix (e.g., "$", "#")
   * @default ''
   */
  prefix?: string;

  /**
   * Value suffix (e.g., "K", "M", "%", "+")
   * @default ''
   */
  suffix?: string;

  /**
   * Thousands separator
   * @default ','
   */
  separator?: string;

  /**
   * Visual variant
   * @default 'default'
   */
  variant?: 'default' | 'brutalist' | 'minimal';

  /**
   * Size variant
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';

  /**
   * Whether to show an animated bar chart
   * @default false
   */
  showBar?: boolean;

  /**
   * Bar fill percentage (0-100)
   * Only used if showBar is true
   * @default 80
   */
  barProgress?: number;

  /**
   * Number of decimal places for the animated counter
   * @default 0
   */
  decimals?: number;
}

/**
 * StatCard ref type
 */
export type StatCardRef = HTMLDivElement;
