'use client';

import { cn } from '@tpmjs/utils/cn';
import { forwardRef } from 'react';
import type {
  SkeletonAvatarProps,
  SkeletonCardProps,
  SkeletonProps,
  SkeletonTextProps,
} from './types';
import {
  skeletonAvatarVariants,
  skeletonCardImageVariants,
  skeletonCardVariants,
  skeletonTextContainerVariants,
  skeletonVariants,
} from './variants';

/**
 * Normalize dimension to CSS value
 */
function normalizeDimension(value: string | number | undefined): string | undefined {
  if (value === undefined) return undefined;
  return typeof value === 'number' ? `${value}px` : value;
}

/**
 * Skeleton component
 *
 * A placeholder component for loading states.
 *
 * @example
 * ```tsx
 * import { Skeleton } from '@tpmjs/ui/Skeleton/Skeleton';
 *
 * function MyComponent() {
 *   return (
 *     <div>
 *       <Skeleton variant="text" width="60%" />
 *       <Skeleton variant="text" width="80%" />
 *       <Skeleton variant="circular" width={40} height={40} />
 *       <Skeleton variant="rectangular" width="100%" height={200} />
 *     </div>
 *   );
 * }
 * ```
 */
export const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
  (
    {
      variant = 'text',
      animation = 'pulse',
      width,
      height,
      lines = 1,
      gap = '0.5rem',
      lastLineShort = false,
      className,
      style,
      ...props
    },
    ref
  ) => {
    // Handle multiple lines for text variant
    if (variant === 'text' && lines > 1) {
      const gapValue = normalizeDimension(gap);

      return (
        <div
          ref={ref}
          className={cn(skeletonTextContainerVariants({}), className)}
          style={{ gap: gapValue, ...style }}
          {...props}
        >
          {Array.from({ length: lines }).map((_, index) => {
            const isLast = index === lines - 1;
            const lineWidth = isLast && lastLineShort ? '60%' : width || '100%';

            return (
              <div
                key={index}
                className={skeletonVariants({ variant, animation })}
                style={{
                  width: normalizeDimension(lineWidth),
                  height: normalizeDimension(height),
                }}
              />
            );
          })}
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={cn(skeletonVariants({ variant, animation }), className)}
        style={{
          width: normalizeDimension(width),
          height: normalizeDimension(height),
          ...style,
        }}
        {...props}
      />
    );
  }
);

Skeleton.displayName = 'Skeleton';

/**
 * SkeletonText component
 *
 * A preset for text loading placeholders.
 *
 * @example
 * ```tsx
 * import { SkeletonText } from '@tpmjs/ui/Skeleton/Skeleton';
 *
 * function MyComponent() {
 *   return <SkeletonText lines={3} />;
 * }
 * ```
 */
export const SkeletonText = forwardRef<HTMLDivElement, SkeletonTextProps>(
  (
    {
      lines = 3,
      gap = '0.5rem',
      width,
      animation = 'pulse',
      className,
      style,
      ...props
    },
    ref
  ) => {
    const gapValue = normalizeDimension(gap);
    const widths = Array.isArray(width) ? width : undefined;

    return (
      <div
        ref={ref}
        className={cn(skeletonTextContainerVariants({}), className)}
        style={{ gap: gapValue, ...style }}
        {...props}
      >
        {Array.from({ length: lines }).map((_, index) => {
          let lineWidth: string | number = '100%';

          if (widths && widths[index] !== undefined) {
            lineWidth = widths[index];
          } else if (!Array.isArray(width) && width !== undefined) {
            lineWidth = width;
          } else if (index === lines - 1) {
            // Make last line shorter by default
            lineWidth = '60%';
          }

          return (
            <div
              key={index}
              className={skeletonVariants({ variant: 'text', animation })}
              style={{ width: normalizeDimension(lineWidth) }}
            />
          );
        })}
      </div>
    );
  }
);

SkeletonText.displayName = 'SkeletonText';

/**
 * SkeletonAvatar component
 *
 * A preset for avatar loading placeholders.
 *
 * @example
 * ```tsx
 * import { SkeletonAvatar } from '@tpmjs/ui/Skeleton/Skeleton';
 *
 * function MyComponent() {
 *   return <SkeletonAvatar size="lg" />;
 * }
 * ```
 */
export const SkeletonAvatar = forwardRef<HTMLDivElement, SkeletonAvatarProps>(
  ({ size = 'md', animation = 'pulse', className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(skeletonAvatarVariants({ size, animation }), className)}
      {...props}
    />
  )
);

SkeletonAvatar.displayName = 'SkeletonAvatar';

/**
 * SkeletonCard component
 *
 * A preset for card loading placeholders.
 *
 * @example
 * ```tsx
 * import { SkeletonCard } from '@tpmjs/ui/Skeleton/Skeleton';
 *
 * function MyComponent() {
 *   return <SkeletonCard showImage lines={3} />;
 * }
 * ```
 */
export const SkeletonCard = forwardRef<HTMLDivElement, SkeletonCardProps>(
  (
    {
      showImage = true,
      lines = 3,
      animation = 'pulse',
      className,
      ...props
    },
    ref
  ) => (
    <div
      ref={ref}
      className={cn(skeletonCardVariants({}), className)}
      {...props}
    >
      {showImage && (
        <div className={skeletonCardImageVariants({ animation })} />
      )}
      <div className="space-y-2">
        {/* Title skeleton */}
        <div
          className={skeletonVariants({ variant: 'text', animation })}
          style={{ width: '70%', height: '1.25rem' }}
        />
        {/* Content skeletons */}
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={skeletonVariants({ variant: 'text', animation })}
            style={{
              width: index === lines - 1 ? '50%' : '100%',
            }}
          />
        ))}
      </div>
    </div>
  )
);

SkeletonCard.displayName = 'SkeletonCard';

/**
 * SkeletonTable component
 *
 * A preset for table loading placeholders.
 *
 * @example
 * ```tsx
 * import { SkeletonTable } from '@tpmjs/ui/Skeleton/Skeleton';
 *
 * function MyComponent() {
 *   return <SkeletonTable rows={5} columns={4} />;
 * }
 * ```
 */
export interface SkeletonTableProps extends React.HTMLAttributes<HTMLDivElement> {
  rows?: number;
  columns?: number;
  animation?: 'pulse' | 'wave' | 'none';
}

export const SkeletonTable = forwardRef<HTMLDivElement, SkeletonTableProps>(
  ({ rows = 5, columns = 4, animation = 'pulse', className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('w-full', className)}
      {...props}
    >
      {/* Header */}
      <div className="flex gap-4 py-3 border-b border-border">
        {Array.from({ length: columns }).map((_, colIndex) => (
          <div
            key={`header-${colIndex}`}
            className={cn(
              skeletonVariants({ variant: 'text', animation }),
              'flex-1'
            )}
            style={{ height: '1rem' }}
          />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={`row-${rowIndex}`}
          className="flex gap-4 py-3 border-b border-border last:border-b-0"
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div
              key={`cell-${rowIndex}-${colIndex}`}
              className={cn(
                skeletonVariants({ variant: 'text', animation }),
                'flex-1'
              )}
              style={{ height: '1rem' }}
            />
          ))}
        </div>
      ))}
    </div>
  )
);

SkeletonTable.displayName = 'SkeletonTable';
