import type { ButtonHTMLAttributes } from 'react';

/**
 * Switch component props
 */
export interface SwitchProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onChange' | 'type'> {
  /**
   * Controlled checked state
   */
  checked?: boolean;

  /**
   * Default checked state for uncontrolled mode
   * @default false
   */
  defaultChecked?: boolean;

  /**
   * Change handler (receives new checked state)
   */
  onChange?: (checked: boolean) => void;

  /**
   * Visual state of the switch
   * @default 'default'
   */
  state?: 'default' | 'error' | 'success';

  /**
   * Size variant
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';

  /**
   * Optional label text
   */
  label?: string;

  /**
   * Label position relative to switch
   * @default 'right'
   */
  labelPosition?: 'left' | 'right';

  /**
   * Loading state (shows spinner, disables interaction)
   * @default false
   */
  loading?: boolean;

  /**
   * Name for form submission
   */
  name?: string;

  /**
   * Value for form submission when checked
   */
  value?: string;
}

/**
 * Switch ref type
 */
export type SwitchRef = HTMLButtonElement;
