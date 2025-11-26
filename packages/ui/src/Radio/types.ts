import type { InputHTMLAttributes } from 'react';

/**
 * Radio component props
 */
export interface RadioProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'type'> {
  /**
   * Visual state of the radio button
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
   * Label position relative to radio
   * @default 'right'
   */
  labelPosition?: 'left' | 'right';
}

/**
 * Radio ref type
 */
export type RadioRef = HTMLInputElement;

/**
 * RadioGroup component props
 */
export interface RadioGroupProps {
  /**
   * Group name for radio buttons
   */
  name: string;

  /**
   * Controlled value
   */
  value?: string;

  /**
   * Default value for uncontrolled mode
   */
  defaultValue?: string;

  /**
   * Change handler
   */
  onChange?: (value: string) => void;

  /**
   * Layout orientation
   * @default 'vertical'
   */
  orientation?: 'horizontal' | 'vertical';

  /**
   * Visual state for all radio buttons in group
   * @default 'default'
   */
  state?: 'default' | 'error' | 'success';

  /**
   * Size variant for all radio buttons in group
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';

  /**
   * Disabled state for all radio buttons
   * @default false
   */
  disabled?: boolean;

  /**
   * Children (Radio components)
   */
  children: React.ReactNode;

  /**
   * Optional className for the group container
   */
  className?: string;

  /**
   * ARIA label for the radio group
   */
  'aria-label'?: string;

  /**
   * ARIA labelledby for the radio group
   */
  'aria-labelledby'?: string;

  /**
   * ARIA describedby for the radio group
   */
  'aria-describedby'?: string;

  /**
   * Required state
   * @default false
   */
  required?: boolean;
}

/**
 * Context value for RadioGroup
 */
export interface RadioGroupContextValue {
  name: string;
  value?: string;
  onChange?: (value: string) => void;
  state?: 'default' | 'error' | 'success';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}
