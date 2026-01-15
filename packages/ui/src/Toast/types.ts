import type { HTMLAttributes, ReactNode } from 'react';

/**
 * Toast variant types
 */
export type ToastVariant = 'default' | 'success' | 'error' | 'warning' | 'info';

/**
 * Toast position types
 */
export type ToastPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

/**
 * Toast component props
 */
export interface ToastProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /**
   * Whether the toast is visible
   */
  open: boolean;

  /**
   * Callback when the toast should close
   */
  onClose: () => void;

  /**
   * Toast title
   */
  title?: ReactNode;

  /**
   * Toast description/message
   */
  description?: ReactNode;

  /**
   * Visual variant
   * @default 'default'
   */
  variant?: ToastVariant;

  /**
   * Action button (optional)
   */
  action?: ReactNode;

  /**
   * Auto-dismiss duration in milliseconds (0 = no auto-dismiss)
   * @default 5000
   */
  duration?: number;

  /**
   * Whether to show the close button
   * @default true
   */
  showCloseButton?: boolean;

  /**
   * Icon to display (auto-detected from variant if not provided)
   */
  icon?: ReactNode;
}

/**
 * ToastContainer component props
 */
export interface ToastContainerProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Position of the toast container
   * @default 'bottom-right'
   */
  position?: ToastPosition;

  /**
   * Children (Toast components)
   */
  children: ReactNode;
}

/**
 * Toast context for managing toasts
 */
export interface ToastContextValue {
  toast: (props: Omit<ToastProps, 'open' | 'onClose'>) => string;
  dismiss: (id: string) => void;
  dismissAll: () => void;
}

/**
 * Internal toast state
 */
export interface ToastState extends Omit<ToastProps, 'open' | 'onClose'> {
  id: string;
  open: boolean;
}

/**
 * Toast ref type
 */
export type ToastRef = HTMLDivElement;
