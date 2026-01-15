import type { HTMLAttributes, ReactNode } from 'react';

/**
 * Tooltip placement types
 */
export type TooltipPlacement =
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
 * Tooltip component props
 */
export interface TooltipProps extends Omit<HTMLAttributes<HTMLDivElement>, 'content'> {
  /**
   * The trigger element (must accept ref)
   */
  children: ReactNode;

  /**
   * The tooltip content (text or ReactNode)
   */
  content: ReactNode;

  /**
   * Placement of the tooltip relative to trigger
   * @default 'top'
   */
  placement?: TooltipPlacement;

  /**
   * Offset from the trigger element in pixels
   * @default 6
   */
  offset?: number;

  /**
   * Delay before showing in milliseconds
   * @default 200
   */
  showDelay?: number;

  /**
   * Delay before hiding in milliseconds
   * @default 0
   */
  hideDelay?: number;

  /**
   * Whether the tooltip has an arrow
   * @default true
   */
  hasArrow?: boolean;

  /**
   * Whether the tooltip is disabled
   * @default false
   */
  disabled?: boolean;

  /**
   * Whether the tooltip is open (controlled mode)
   */
  open?: boolean;

  /**
   * Callback when open state changes
   */
  onOpenChange?: (open: boolean) => void;
}

/**
 * Tooltip ref type
 */
export type TooltipRef = HTMLDivElement;
