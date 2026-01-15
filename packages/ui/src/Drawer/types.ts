import type { HTMLAttributes, ReactNode } from 'react';

/**
 * Drawer side types
 */
export type DrawerSide = 'left' | 'right' | 'top' | 'bottom';

/**
 * Drawer size types
 */
export type DrawerSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

/**
 * Drawer component props
 */
export interface DrawerProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /**
   * Whether the drawer is open
   */
  open: boolean;

  /**
   * Callback when the drawer should close
   */
  onClose: () => void;

  /**
   * Which side the drawer slides in from
   * @default 'right'
   */
  side?: DrawerSide;

  /**
   * Size of the drawer
   * @default 'md'
   */
  size?: DrawerSize;

  /**
   * Drawer title (displayed in header)
   */
  title?: ReactNode;

  /**
   * Drawer description (for accessibility)
   */
  description?: string;

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
   * Drawer content
   */
  children: ReactNode;
}

/**
 * DrawerHeader component props
 */
export interface DrawerHeaderProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

/**
 * DrawerBody component props
 */
export interface DrawerBodyProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

/**
 * DrawerFooter component props
 */
export interface DrawerFooterProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

/**
 * Drawer ref type
 */
export type DrawerRef = HTMLDivElement;
