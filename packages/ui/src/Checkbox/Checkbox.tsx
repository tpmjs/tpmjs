import { cn } from '@tpmjs/utils/cn';
import { forwardRef, useEffect, useRef } from 'react';
import type { CheckboxProps } from './types';
import {
  checkboxLabelVariants,
  checkboxUIVariants,
  checkboxVariants,
  checkmarkVariants,
  indeterminateVariants,
} from './variants';

/**
 * Checkbox component
 *
 * A custom-styled checkbox with support for indeterminate state,
 * different sizes, states, and optional labels.
 *
 * @example
 * ```tsx
 * import { Checkbox } from '@tpmjs/ui/Checkbox/Checkbox';
 *
 * function MyComponent() {
 *   return (
 *     <Checkbox
 *       label="Accept terms and conditions"
 *       state="default"
 *       size="md"
 *     />
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Indeterminate state (for partial selections)
 * <Checkbox
 *   label="Select all"
 *   indeterminate={true}
 *   onChange={handleSelectAll}
 * />
 * ```
 */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      className,
      state = 'default',
      size = 'md',
      indeterminate = false,
      label,
      labelPosition = 'right',
      disabled = false,
      id,
      ...props
    },
    ref
  ) => {
    const inputRef = useRef<HTMLInputElement | null>(null);

    // Handle indeterminate state via DOM property
    useEffect(() => {
      const input = inputRef.current;
      if (input) {
        input.indeterminate = indeterminate;
        // Set data attribute for CSS styling
        if (indeterminate) {
          input.setAttribute('data-indeterminate', 'true');
        } else {
          input.removeAttribute('data-indeterminate');
        }
      }
    }, [indeterminate]);

    // Generate unique ID if not provided
    const checkboxId = id || `checkbox-${Math.random().toString(36).substring(2, 9)}`;

    const checkboxInput = (
      <input
        ref={(node) => {
          inputRef.current = node;
          if (typeof ref === 'function') {
            ref(node);
          } else if (ref) {
            ref.current = node;
          }
        }}
        type="checkbox"
        id={checkboxId}
        className={cn(checkboxVariants({ state, size }), className)}
        disabled={disabled}
        aria-checked={indeterminate ? 'mixed' : undefined}
        {...props}
      />
    );

    const checkboxUI = (
      <span className={cn(checkboxUIVariants({ state, size }))}>
        {/* Checkmark icon */}
        <svg
          className={cn(checkmarkVariants({ size }))}
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M13.5 4.5L6 12L2.5 8.5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        {/* Indeterminate line */}
        <svg
          className={cn(indeterminateVariants({ size }))}
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M4 8H12"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </span>
    );

    const labelElement = label ? (
      <label
        htmlFor={checkboxId}
        className={cn(
          checkboxLabelVariants({ size }),
          labelPosition === 'left' ? 'mr-2' : 'ml-2'
        )}
      >
        {label}
      </label>
    ) : null;

    return (
      <div className={cn('inline-flex items-center', disabled && 'cursor-not-allowed')}>
        {labelPosition === 'left' && labelElement}
        <div className="relative inline-flex">
          {checkboxInput}
          {checkboxUI}
        </div>
        {labelPosition === 'right' && labelElement}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';
