import { cn } from '@tpmjs/utils/cn';
import { forwardRef, useMemo } from 'react';
import type { TextareaProps } from './types';
import { textareaVariants } from './variants';

/**
 * Textarea component
 *
 * A multi-line text input component with support for character counting,
 * different states, sizes, and resize behaviors.
 *
 * @example
 * ```tsx
 * import { Textarea } from '@tpmjs/ui/Textarea/Textarea';
 *
 * function MyComponent() {
 *   return (
 *     <Textarea
 *       placeholder="Enter your message..."
 *       rows={5}
 *       maxLength={500}
 *       showCount
 *       state="default"
 *       size="md"
 *     />
 *   );
 * }
 * ```
 */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      state = 'default',
      size = 'md',
      fullWidth = true,
      resize = 'vertical',
      showCount = false,
      maxLength,
      value,
      defaultValue,
      disabled = false,
      ...props
    },
    ref
  ) => {
    // Calculate character count for display
    const characterCount = useMemo(() => {
      if (!showCount) return null;

      const currentValue = value ?? defaultValue ?? '';
      const current =
        typeof currentValue === 'string' ? currentValue.length : String(currentValue).length;

      return {
        current,
        max: maxLength,
      };
    }, [showCount, value, defaultValue, maxLength]);

    return (
      <div className={cn('relative', fullWidth && 'w-full')}>
        <textarea
          ref={ref}
          className={cn(
            textareaVariants({
              state,
              size,
              fullWidth: fullWidth ? 'true' : 'false',
              resize,
            }),
            className
          )}
          disabled={disabled}
          maxLength={maxLength}
          value={value}
          defaultValue={defaultValue}
          aria-invalid={state === 'error' ? 'true' : undefined}
          {...props}
        />

        {/* Character counter */}
        {showCount && characterCount && (
          <div
            className={cn(
              'mt-1.5 text-xs',
              state === 'error' ? 'text-error' : 'text-foreground-secondary',
              'transition-colors duration-200'
            )}
            aria-live="polite"
            aria-atomic="true"
          >
            {characterCount.current}
            {characterCount.max !== undefined && (
              <>
                <span className="text-foreground-tertiary"> / </span>
                {characterCount.max}
              </>
            )}
          </div>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
