import type { HTMLAttributes, ReactNode } from 'react';

/**
 * Pagination size types
 */
export type PaginationSize = 'sm' | 'md' | 'lg';

/**
 * Pagination variant types
 */
export type PaginationVariant = 'default' | 'simple' | 'minimal';

/**
 * Pagination component props
 */
export interface PaginationProps extends HTMLAttributes<HTMLElement> {
  /**
   * Current page (1-indexed)
   */
  page: number;

  /**
   * Total number of pages
   */
  totalPages: number;

  /**
   * Callback when page changes
   */
  onPageChange: (page: number) => void;

  /**
   * Number of sibling pages to show on each side
   * @default 1
   */
  siblings?: number;

  /**
   * Number of boundary pages to show at start/end
   * @default 1
   */
  boundaries?: number;

  /**
   * Size variant
   * @default 'md'
   */
  size?: PaginationSize;

  /**
   * Visual variant
   * @default 'default'
   */
  variant?: PaginationVariant;

  /**
   * Whether to show first/last page buttons
   * @default false
   */
  showFirstLast?: boolean;

  /**
   * Whether to show previous/next buttons
   * @default true
   */
  showPrevNext?: boolean;

  /**
   * Label for previous button
   * @default 'Previous'
   */
  previousLabel?: ReactNode;

  /**
   * Label for next button
   * @default 'Next'
   */
  nextLabel?: ReactNode;

  /**
   * Whether the pagination is disabled
   * @default false
   */
  disabled?: boolean;
}

/**
 * PaginationItem component props
 */
export interface PaginationItemProps extends HTMLAttributes<HTMLButtonElement> {
  /**
   * Whether this is the current page
   */
  active?: boolean;

  /**
   * Whether the item is disabled
   */
  disabled?: boolean;

  /**
   * Size variant
   */
  size?: PaginationSize;

  /**
   * Item content
   */
  children: ReactNode;
}

/**
 * PaginationEllipsis component props
 */
export interface PaginationEllipsisProps extends HTMLAttributes<HTMLSpanElement> {
  /**
   * Size variant
   */
  size?: PaginationSize;
}

/**
 * Pagination ref type
 */
export type PaginationRef = HTMLElement;
