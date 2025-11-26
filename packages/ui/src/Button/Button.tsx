import { cn } from '@tpmjs/utils/cn';
import { forwardRef } from 'react';
import type { ButtonProps } from './types';
import { buttonVariants } from './variants';

/**
 * Button component
 *
 * A versatile button component with multiple variants, sizes, and states.
 *
 * @example
 * ```tsx
 * import { Button } from '@tpmjs/ui/Button/Button';
 *
 * function MyComponent() {
 *   return (
 *     <Button
 *       variant="outline"
 *       size="lg"
 *       onClick={() => console.log('clicked')}
 *     >
 *       Click me
 *     </Button>
 *   );
 * }
 * ```
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'default',
      size = 'md',
      loading = false,
      disabled = false,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          buttonVariants({
            variant,
            size,
            loading: loading ? 'true' : 'false',
          }),
          className
        )}
        disabled={disabled || loading}
        aria-disabled={disabled || loading ? 'true' : undefined}
        aria-busy={loading ? 'true' : undefined}
        {...props}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <span
              className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
              aria-hidden="true"
            />
            <span>{children}</span>
          </span>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
