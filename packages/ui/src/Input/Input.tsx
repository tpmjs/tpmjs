import { cn } from '@tpmjs/utils/cn';
import { forwardRef } from 'react';
import type { InputProps } from './types';
import { inputVariants } from './variants';

/**
 * Input component
 *
 * A versatile input component with multiple states, sizes, and full HTML input support.
 *
 * @example
 * ```tsx
 * import { Input } from '@tpmjs/ui/Input/Input';
 *
 * function MyComponent() {
 *   return (
 *     <Input
 *       type="email"
 *       placeholder="Enter your email"
 *       state="default"
 *       size="md"
 *     />
 *   );
 * }
 * ```
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = 'text',
      state = 'default',
      size = 'md',
      fullWidth = true,
      disabled = false,
      ...props
    },
    ref
  ) => {
    return (
      <input
        ref={ref}
        type={type}
        className={cn(
          inputVariants({
            state,
            size,
            fullWidth: fullWidth ? 'true' : 'false',
          }),
          className
        )}
        disabled={disabled}
        aria-invalid={state === 'error' ? 'true' : undefined}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';
