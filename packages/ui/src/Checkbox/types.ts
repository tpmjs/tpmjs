import type { InputHTMLAttributes } from 'react';

/**
 * Checkbox component props
 */
export interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'type'> {
  /**
   * Visual state of the checkbox
   * @default 'default'
   */
  state?: 'default' | 'error' | 'success';

  /**
   * Size variant
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';

  /**
   * Indeterminate state (for partial selections in tree views)
   * @default false
   */
  indeterminate?: boolean;

  /**
   * Optional label text
   */
  label?: string;

  /**
   * Label position relative to checkbox
   * @default 'right'
   */
  labelPosition?: 'left' | 'right';
}

/**
 * Checkbox ref type
 */
export type CheckboxRef = HTMLInputElement;
