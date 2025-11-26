import type { HTMLAttributes, ReactNode } from 'react';

/**
 * FormField component props
 */
export interface FormFieldProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Label text
   */
  label?: string;

  /**
   * ID of the form control (for htmlFor association)
   */
  htmlFor?: string;

  /**
   * Whether the field is required
   * @default false
   */
  required?: boolean;

  /**
   * Error message to display
   */
  error?: string;

  /**
   * Helper text to display
   */
  helperText?: string;

  /**
   * Visual state (affects label and helper text color)
   * @default 'default'
   */
  state?: 'default' | 'error' | 'success';

  /**
   * Whether the field is disabled
   * @default false
   */
  disabled?: boolean;

  /**
   * The form control element (Input, Select, Textarea, etc.)
   */
  children: ReactNode;

  /**
   * Layout orientation for label and control
   * @default 'vertical'
   */
  orientation?: 'vertical' | 'horizontal';
}
