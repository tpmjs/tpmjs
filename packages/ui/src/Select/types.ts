import type { SelectHTMLAttributes } from 'react';

/**
 * Option for Select component
 */
export interface SelectOption {
  /**
   * Option value
   */
  value: string;

  /**
   * Option label (displayed text)
   */
  label: string;

  /**
   * Whether the option is disabled
   * @default false
   */
  disabled?: boolean;
}

/**
 * Option group for Select component
 */
export interface SelectOptionGroup {
  /**
   * Group label
   */
  label: string;

  /**
   * Options in the group
   */
  options: SelectOption[];
}

/**
 * Select component props
 */
export interface SelectProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  /**
   * Visual state of the select
   * @default 'default'
   */
  state?: 'default' | 'error' | 'success';

  /**
   * Size variant
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';

  /**
   * Whether select should take full width
   * @default true
   */
  fullWidth?: boolean;

  /**
   * Options (simple array)
   */
  options?: SelectOption[];

  /**
   * Grouped options
   */
  optionGroups?: SelectOptionGroup[];

  /**
   * Placeholder text (shown as first disabled option)
   */
  placeholder?: string;

  /**
   * Loading state (shows spinner, disables interaction)
   * @default false
   */
  loading?: boolean;
}

/**
 * Select ref type
 */
export type SelectRef = HTMLSelectElement;
