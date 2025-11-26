import type { HTMLAttributes, ReactNode } from 'react';

/**
 * Header component props
 */
export interface HeaderProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  /**
   * Title/logo content for the left side
   */
  title?: ReactNode;

  /**
   * Actions/navigation for the right side
   */
  actions?: ReactNode;

  /**
   * Size variant
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';

  /**
   * Whether header is sticky
   * @default false
   */
  sticky?: boolean;
}

/**
 * Header ref type
 */
export type HeaderRef = HTMLElement;
