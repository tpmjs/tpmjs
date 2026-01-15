import type { HTMLAttributes, ReactNode, RefObject } from 'react';

/**
 * Popover placement types
 */
export type PopoverPlacement =
  | 'top'
  | 'top-start'
  | 'top-end'
  | 'bottom'
  | 'bottom-start'
  | 'bottom-end'
  | 'left'
  | 'left-start'
  | 'left-end'
  | 'right'
  | 'right-start'
  | 'right-end';

/**
 * Popover trigger types
 */
export type PopoverTrigger = 'click' | 'hover' | 'focus' | 'manual';

/**
 * Popover component props
 */
export interface PopoverProps extends Omit<HTMLAttributes<HTMLDivElement>, 'content'> {
  /**
   * Whether the popover is open (controlled mode)
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
   * The trigger element (must accept ref)
   */
  children: ReactNode;

  /**
   * The popover content
   */
  content: ReactNode;

  /**
   * Placement of the popover relative to trigger
   * @default 'bottom'
   */
  placement?: PopoverPlacement;

  /**
   * How the popover is triggered
   * @default 'click'
   */
  trigger?: PopoverTrigger;

  /**
   * Offset from the trigger element in pixels
   * @default 8
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
   * Delay before showing (for hover trigger) in milliseconds
   * @default 0
   */
  showDelay?: number;

  /**
   * Delay before hiding (for hover trigger) in milliseconds
   * @default 0
   */
  hideDelay?: number;

  /**
   * Whether the popover has an arrow
   * @default false
   */
  hasArrow?: boolean;

  /**
   * Whether the popover is disabled
   * @default false
   */
  disabled?: boolean;
}

/**
 * PopoverContent component props
 */
export interface PopoverContentProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

/**
 * PopoverTrigger component props
 */
export interface PopoverTriggerProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
  asChild?: boolean;
}

/**
 * Popover ref type
 */
export type PopoverRef = HTMLDivElement;

/**
 * Internal popover state
 */
export interface PopoverState {
  isOpen: boolean;
  triggerRef: RefObject<HTMLElement | null>;
  contentRef: RefObject<HTMLDivElement | null>;
}
