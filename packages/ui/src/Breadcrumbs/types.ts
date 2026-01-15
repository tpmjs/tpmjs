import type { HTMLAttributes, ReactNode } from 'react';

/**
 * Breadcrumb separator types
 */
export type BreadcrumbSeparator = 'slash' | 'chevron' | 'arrow' | 'dot';

/**
 * Breadcrumbs component props
 */
export interface BreadcrumbsProps extends HTMLAttributes<HTMLElement> {
  /**
   * Separator between items
   * @default 'slash'
   */
  separator?: BreadcrumbSeparator | ReactNode;

  /**
   * Maximum number of items to show before collapsing
   * @default undefined (no collapse)
   */
  maxItems?: number;

  /**
   * Number of items to show at start when collapsed
   * @default 1
   */
  itemsBeforeCollapse?: number;

  /**
   * Number of items to show at end when collapsed
   * @default 1
   */
  itemsAfterCollapse?: number;

  /**
   * Breadcrumb items
   */
  children: ReactNode;
}

/**
 * BreadcrumbItem component props
 */
export interface BreadcrumbItemProps extends HTMLAttributes<HTMLLIElement> {
  /**
   * Whether this is the current/active page
   * @default false
   */
  current?: boolean;

  /**
   * Link href (if not current)
   */
  href?: string;

  /**
   * Icon to display before text
   */
  icon?: ReactNode;

  /**
   * Item content
   */
  children: ReactNode;
}

/**
 * BreadcrumbLink component props
 */
export interface BreadcrumbLinkProps extends HTMLAttributes<HTMLAnchorElement> {
  /**
   * Link href
   */
  href: string;

  /**
   * Link content
   */
  children: ReactNode;
}

/**
 * BreadcrumbSeparator component props
 */
export interface BreadcrumbSeparatorProps extends HTMLAttributes<HTMLSpanElement> {
  /**
   * Custom separator content
   */
  children?: ReactNode;
}

/**
 * BreadcrumbEllipsis component props
 */
export interface BreadcrumbEllipsisProps extends HTMLAttributes<HTMLSpanElement> {}

/**
 * Breadcrumbs ref type
 */
export type BreadcrumbsRef = HTMLElement;
