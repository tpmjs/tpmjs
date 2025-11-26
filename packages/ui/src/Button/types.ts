import type { ButtonHTMLAttributes } from 'react';

/**
 * Button component props
 */
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Visual variant of the button
   * @default 'default'
   */
  variant?:
    | 'default'
    | 'destructive'
    | 'outline'
    | 'outline-dotted'
    | 'secondary'
    | 'ghost'
    | 'link'
    | 'blueprint';

  /**
   * Size of the button
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg' | 'icon';

  /**
   * Loading state - disables button and shows loading indicator
   * @default false
   */
  loading?: boolean;
}

/**
 * Button ref type
 */
export type ButtonRef = HTMLButtonElement;
