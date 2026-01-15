'use client';

import { cn } from '@tpmjs/utils/cn';
import { forwardRef, useCallback, useMemo } from 'react';
import { Icon } from '../Icon/Icon';
import type {
  PaginationEllipsisProps,
  PaginationItemProps,
  PaginationProps,
} from './types';
import {
  paginationEllipsisVariants,
  paginationInfoVariants,
  paginationItemVariants,
  paginationNavButtonVariants,
  paginationVariants,
} from './variants';

/**
 * Generate pagination range with ellipsis
 */
function generatePaginationRange(
  page: number,
  totalPages: number,
  siblings: number,
  boundaries: number
): (number | 'ellipsis')[] {
  const range: (number | 'ellipsis')[] = [];

  // Always show first `boundaries` pages
  for (let i = 1; i <= Math.min(boundaries, totalPages); i++) {
    range.push(i);
  }

  // Calculate sibling range
  const siblingStart = Math.max(
    boundaries + 1,
    page - siblings
  );
  const siblingEnd = Math.min(
    totalPages - boundaries,
    page + siblings
  );

  // Add ellipsis if there's a gap after boundaries
  if (siblingStart > boundaries + 1) {
    range.push('ellipsis');
  }

  // Add sibling pages
  for (let i = siblingStart; i <= siblingEnd; i++) {
    if (!range.includes(i)) {
      range.push(i);
    }
  }

  // Add ellipsis if there's a gap before end boundaries
  if (siblingEnd < totalPages - boundaries) {
    range.push('ellipsis');
  }

  // Always show last `boundaries` pages
  for (let i = Math.max(totalPages - boundaries + 1, 1); i <= totalPages; i++) {
    if (!range.includes(i)) {
      range.push(i);
    }
  }

  return range;
}

/**
 * Pagination component
 *
 * A component for navigating between pages of content.
 *
 * @example
 * ```tsx
 * import { Pagination } from '@tpmjs/ui/Pagination/Pagination';
 *
 * function MyComponent() {
 *   const [page, setPage] = useState(1);
 *
 *   return (
 *     <Pagination
 *       page={page}
 *       totalPages={10}
 *       onPageChange={setPage}
 *     />
 *   );
 * }
 * ```
 */
export const Pagination = forwardRef<HTMLElement, PaginationProps>(
  (
    {
      page,
      totalPages,
      onPageChange,
      siblings = 1,
      boundaries = 1,
      size = 'md',
      variant = 'default',
      showFirstLast = false,
      showPrevNext = true,
      previousLabel = 'Previous',
      nextLabel = 'Next',
      disabled = false,
      className,
      ...props
    },
    ref
  ) => {
    const paginationRange = useMemo(
      () => generatePaginationRange(page, totalPages, siblings, boundaries),
      [page, totalPages, siblings, boundaries]
    );

    const handlePageChange = useCallback(
      (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages && newPage !== page) {
          onPageChange(newPage);
        }
      },
      [page, totalPages, onPageChange]
    );

    const isFirstPage = page === 1;
    const isLastPage = page === totalPages;

    // Simple variant: just prev/next with page info
    if (variant === 'simple') {
      return (
        <nav
          ref={ref}
          role="navigation"
          aria-label="Pagination"
          className={cn(paginationVariants({ size }), className)}
          {...props}
        >
          <button
            type="button"
            disabled={disabled || isFirstPage}
            onClick={() => handlePageChange(page - 1)}
            className={paginationNavButtonVariants({ size, disabled: (disabled || isFirstPage) ? 'true' : 'false' })}
            aria-label="Go to previous page"
          >
            <Icon icon="chevronLeft" size={size === 'sm' ? 'xs' : 'sm'} />
            {previousLabel}
          </button>

          <span className={paginationInfoVariants({ size })}>
            {page} / {totalPages}
          </span>

          <button
            type="button"
            disabled={disabled || isLastPage}
            onClick={() => handlePageChange(page + 1)}
            className={paginationNavButtonVariants({ size, disabled: (disabled || isLastPage) ? 'true' : 'false' })}
            aria-label="Go to next page"
          >
            {nextLabel}
            <Icon icon="chevronRight" size={size === 'sm' ? 'xs' : 'sm'} />
          </button>
        </nav>
      );
    }

    // Minimal variant: just prev/next icons
    if (variant === 'minimal') {
      return (
        <nav
          ref={ref}
          role="navigation"
          aria-label="Pagination"
          className={cn(paginationVariants({ size }), className)}
          {...props}
        >
          <button
            type="button"
            disabled={disabled || isFirstPage}
            onClick={() => handlePageChange(page - 1)}
            className={paginationItemVariants({ size, disabled: (disabled || isFirstPage) ? 'true' : 'false' })}
            aria-label="Go to previous page"
          >
            <Icon icon="chevronLeft" size={size === 'sm' ? 'xs' : 'sm'} />
          </button>

          <span className={paginationInfoVariants({ size })}>
            {page} / {totalPages}
          </span>

          <button
            type="button"
            disabled={disabled || isLastPage}
            onClick={() => handlePageChange(page + 1)}
            className={paginationItemVariants({ size, disabled: (disabled || isLastPage) ? 'true' : 'false' })}
            aria-label="Go to next page"
          >
            <Icon icon="chevronRight" size={size === 'sm' ? 'xs' : 'sm'} />
          </button>
        </nav>
      );
    }

    // Default variant: full pagination with page numbers
    return (
      <nav
        ref={ref}
        role="navigation"
        aria-label="Pagination"
        className={cn(paginationVariants({ size }), className)}
        {...props}
      >
        {/* First page button */}
        {showFirstLast && (
          <button
            type="button"
            disabled={disabled || isFirstPage}
            onClick={() => handlePageChange(1)}
            className={paginationItemVariants({ size, disabled: (disabled || isFirstPage) ? 'true' : 'false' })}
            aria-label="Go to first page"
          >
            <Icon icon="chevronsLeft" size={size === 'sm' ? 'xs' : 'sm'} />
          </button>
        )}

        {/* Previous button */}
        {showPrevNext && (
          <button
            type="button"
            disabled={disabled || isFirstPage}
            onClick={() => handlePageChange(page - 1)}
            className={paginationItemVariants({ size, disabled: (disabled || isFirstPage) ? 'true' : 'false' })}
            aria-label="Go to previous page"
          >
            <Icon icon="chevronLeft" size={size === 'sm' ? 'xs' : 'sm'} />
          </button>
        )}

        {/* Page numbers */}
        {paginationRange.map((item, index) => {
          if (item === 'ellipsis') {
            return (
              <PaginationEllipsis
                key={`ellipsis-${index}`}
                size={size}
              />
            );
          }

          return (
            <button
              key={item}
              type="button"
              disabled={disabled}
              onClick={() => handlePageChange(item)}
              className={paginationItemVariants({
                size,
                active: item === page ? 'true' : 'false',
                disabled: disabled ? 'true' : 'false',
              })}
              aria-label={`Go to page ${item}`}
              aria-current={item === page ? 'page' : undefined}
            >
              {item}
            </button>
          );
        })}

        {/* Next button */}
        {showPrevNext && (
          <button
            type="button"
            disabled={disabled || isLastPage}
            onClick={() => handlePageChange(page + 1)}
            className={paginationItemVariants({ size, disabled: (disabled || isLastPage) ? 'true' : 'false' })}
            aria-label="Go to next page"
          >
            <Icon icon="chevronRight" size={size === 'sm' ? 'xs' : 'sm'} />
          </button>
        )}

        {/* Last page button */}
        {showFirstLast && (
          <button
            type="button"
            disabled={disabled || isLastPage}
            onClick={() => handlePageChange(totalPages)}
            className={paginationItemVariants({ size, disabled: (disabled || isLastPage) ? 'true' : 'false' })}
            aria-label="Go to last page"
          >
            <Icon icon="chevronsRight" size={size === 'sm' ? 'xs' : 'sm'} />
          </button>
        )}
      </nav>
    );
  }
);

Pagination.displayName = 'Pagination';

/**
 * PaginationItem component (for custom usage)
 */
export const PaginationItem = forwardRef<HTMLButtonElement, PaginationItemProps>(
  ({ active = false, disabled = false, size = 'md', children, className, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      disabled={disabled}
      className={cn(paginationItemVariants({ size, active: active ? 'true' : 'false', disabled: disabled ? 'true' : 'false' }), className)}
      {...props}
    >
      {children}
    </button>
  )
);

PaginationItem.displayName = 'PaginationItem';

/**
 * PaginationEllipsis component
 */
export const PaginationEllipsis = forwardRef<HTMLSpanElement, PaginationEllipsisProps>(
  ({ size = 'md', className, ...props }, ref) => (
    <span
      ref={ref}
      aria-hidden="true"
      className={cn(paginationEllipsisVariants({ size }), className)}
      {...props}
    >
      <Icon icon="moreHorizontal" size={size === 'sm' ? 'xs' : 'sm'} />
    </span>
  )
);

PaginationEllipsis.displayName = 'PaginationEllipsis';
