import type { TextareaHTMLAttributes } from 'react';

/**
 * Textarea component props
 */
export interface TextareaProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'> {
  /**
   * Visual state of the textarea
   * @default 'default'
   */
  state?: 'default' | 'error' | 'success';

  /**
   * Size of the textarea
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';

  /**
   * Full width textarea
   * @default true
   */
  fullWidth?: boolean;

  /**
   * Resize behavior
   * @default 'vertical'
   */
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';

  /**
   * Show character count
   * Displays current/max character count below textarea
   * @default false
   */
  showCount?: boolean;
}

/**
 * Textarea ref type
 */
export type TextareaRef = HTMLTextAreaElement;
