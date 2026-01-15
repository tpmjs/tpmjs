import type { HTMLAttributes, ReactNode } from 'react';

/**
 * Modal component props
 */
export interface ModalProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /**
   * Whether the modal is open
   */
  open: boolean;

  /**
   * Callback when the modal should close
   */
  onClose: () => void;

  /**
   * Modal title (displayed in header)
   */
  title?: ReactNode;

  /**
   * Modal description (for accessibility)
   */
  description?: string;

  /**
   * Size of the modal
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';

  /**
   * Whether to close on backdrop click
   * @default true
   */
  closeOnBackdropClick?: boolean;

  /**
   * Whether to close on Escape key
   * @default true
   */
  closeOnEscape?: boolean;

  /**
   * Whether to show the close button
   * @default true
   */
  showCloseButton?: boolean;

  /**
   * Footer content (buttons, actions)
   */
  footer?: ReactNode;

  /**
   * Modal content
   */
  children: ReactNode;
}

/**
 * ModalHeader component props
 */
export interface ModalHeaderProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

/**
 * ModalBody component props
 */
export interface ModalBodyProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

/**
 * ModalFooter component props
 */
export interface ModalFooterProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

/**
 * Modal ref type
 */
export type ModalRef = HTMLDivElement;
