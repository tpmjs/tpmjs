import { cn } from '@tpmjs/utils/cn';
import { forwardRef } from 'react';
import type { ContainerProps } from './types';
import { containerVariants } from './variants';

/**
 * Container component
 *
 * A layout wrapper component with responsive max-width constraints.
 * Centers content and provides consistent horizontal padding.
 *
 * @example
 * ```tsx
 * import { Container } from '@tpmjs/ui/Container/Container';
 *
 * function MyComponent() {
 *   return (
 *     <Container size="xl" padding="md">
 *       Page content goes here
 *     </Container>
 *   );
 * }
 * ```
 */
export const Container = forwardRef<HTMLDivElement, ContainerProps>(
  ({ className, size = 'xl', padding = 'md', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          containerVariants({
            size,
            padding,
          }),
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Container.displayName = 'Container';
