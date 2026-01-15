import type { HTMLAttributes, ReactNode } from 'react';

/**
 * Dropdown menu placement types
 */
export type DropdownMenuPlacement =
  | 'bottom'
  | 'bottom-start'
  | 'bottom-end'
  | 'top'
  | 'top-start'
  | 'top-end';

/**
 * DropdownMenu component props
 */
export interface DropdownMenuProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Whether the menu is open (controlled mode)
   */
  open?: boolean;

  /**
   * Callback when open state changes
   */
  onOpenChange?: (open: boolean) => void;

  /**
   * Default open state (uncontrolled mode)
   * @default false
   */
  defaultOpen?: boolean;

  /**
   * The trigger element
   */
  trigger: ReactNode;

  /**
   * Placement of the menu relative to trigger
   * @default 'bottom-start'
   */
  placement?: DropdownMenuPlacement;

  /**
   * Offset from the trigger element in pixels
   * @default 4
   */
  offset?: number;

  /**
   * Whether to close when clicking outside
   * @default true
   */
  closeOnClickOutside?: boolean;

  /**
   * Whether to close on Escape key
   * @default true
   */
  closeOnEscape?: boolean;

  /**
   * Whether to close when an item is selected
   * @default true
   */
  closeOnSelect?: boolean;

  /**
   * Menu items
   */
  children: ReactNode;
}

/**
 * DropdownMenuItem component props
 */
export interface DropdownMenuItemProps extends HTMLAttributes<HTMLButtonElement> {
  /**
   * Whether the item is disabled
   * @default false
   */
  disabled?: boolean;

  /**
   * Whether the item is destructive (red styling)
   * @default false
   */
  destructive?: boolean;

  /**
   * Icon to display before the label
   */
  icon?: ReactNode;

  /**
   * Keyboard shortcut to display
   */
  shortcut?: string;

  /**
   * Callback when item is selected
   */
  onSelect?: () => void;

  /**
   * Item content
   */
  children: ReactNode;
}

/**
 * DropdownMenuSeparator component props
 */
export interface DropdownMenuSeparatorProps extends HTMLAttributes<HTMLDivElement> {}

/**
 * DropdownMenuLabel component props
 */
export interface DropdownMenuLabelProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

/**
 * DropdownMenuGroup component props
 */
export interface DropdownMenuGroupProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Group label
   */
  label?: string;

  /**
   * Group items
   */
  children: ReactNode;
}

/**
 * DropdownMenu ref type
 */
export type DropdownMenuRef = HTMLDivElement;
