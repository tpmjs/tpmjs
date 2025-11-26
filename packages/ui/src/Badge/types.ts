import type { HTMLAttributes } from 'react';

/**
 * Badge component props
 */
export interface BadgeProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Visual variant of the badge
   * @default 'default'
   */
  variant?: 'default' | 'secondary' | 'outline' | 'success' | 'error' | 'warning' | 'info';

  /**
   * Size of the badge
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Badge ref type
 */
export type BadgeRef = HTMLDivElement;
