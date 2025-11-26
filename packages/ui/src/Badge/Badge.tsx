import { cn } from '@tpmjs/utils/cn';
import { forwardRef } from 'react';
import type { BadgeProps } from './types';
import { badgeVariants } from './variants';

/**
 * Badge component
 *
 * A versatile badge component for status indicators, tags, and labels.
 *
 * @example
 * ```tsx
 * import { Badge } from '@tpmjs/ui/Badge/Badge';
 *
 * function MyComponent() {
 *   return <Badge variant="success">Active</Badge>;
 * }
 * ```
 */
export const Badge = forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'default', size = 'md', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          badgeVariants({
            variant,
            size,
          }),
          className
        )}
        {...props}
      />
    );
  }
);

Badge.displayName = 'Badge';
