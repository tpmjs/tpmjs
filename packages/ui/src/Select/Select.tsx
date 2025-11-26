import { cn } from '@tpmjs/utils/cn';
import { forwardRef } from 'react';
import type { SelectProps } from './types';
import { selectIconVariants, selectSpinnerVariants, selectVariants } from './variants';

/**
 * Select component
 *
 * A native select element with custom styling, support for options and option groups,
 * loading states, and full accessibility.
 *
 * @example
 * ```tsx
 * import { Select } from '@tpmjs/ui/Select/Select';
 *
 * function MyComponent() {
 *   const options = [
 *     { value: 'apple', label: 'Apple' },
 *     { value: 'banana', label: 'Banana' },
 *     { value: 'orange', label: 'Orange' },
 *   ];
 *
 *   return (
 *     <Select
 *       options={options}
 *       placeholder="Select a fruit"
 *     />
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // With option groups
 * const optionGroups = [
 *   {
 *     label: 'Fruits',
 *     options: [
 *       { value: 'apple', label: 'Apple' },
 *       { value: 'banana', label: 'Banana' },
 *     ],
 *   },
 *   {
 *     label: 'Vegetables',
 *     options: [
 *       { value: 'carrot', label: 'Carrot' },
 *       { value: 'broccoli', label: 'Broccoli' },
 *     ],
 *   },
 * ];
 *
 * <Select optionGroups={optionGroups} placeholder="Select a food" />
 * ```
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      state = 'default',
      size = 'md',
      fullWidth = true,
      options,
      optionGroups,
      placeholder,
      loading = false,
      disabled = false,
      children,
      ...props
    },
    ref
  ) => {
    // Determine if we should render children or options
    const hasChildren = !!children;
    const hasOptions = !!options && options.length > 0;
    const hasOptionGroups = !!optionGroups && optionGroups.length > 0;

    return (
      <div className={cn('relative inline-flex', fullWidth && 'w-full')}>
        <select
          ref={ref}
          className={cn(
            selectVariants({ state, size, fullWidth: fullWidth ? 'true' : 'false' }),
            className
          )}
          disabled={disabled || loading}
          data-loading={loading ? 'true' : 'false'}
          aria-invalid={state === 'error' ? 'true' : undefined}
          {...props}
        >
          {/* Placeholder option */}
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}

          {/* Render children if provided */}
          {hasChildren && children}

          {/* Render simple options if provided */}
          {!hasChildren && hasOptions &&
            options.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}

          {/* Render option groups if provided */}
          {!hasChildren && !hasOptions && hasOptionGroups &&
            optionGroups.map((group) => (
              <optgroup key={group.label} label={group.label}>
                {group.options.map((option) => (
                  <option
                    key={option.value}
                    value={option.value}
                    disabled={option.disabled}
                  >
                    {option.label}
                  </option>
                ))}
              </optgroup>
            ))}
        </select>

        {/* Chevron down icon or loading spinner */}
        {loading ? (
          <span className={cn(selectSpinnerVariants({ size }))} aria-hidden="true">
            <svg
              className="animate-spin"
              width={size === 'sm' ? 14 : size === 'md' ? 16 : 18}
              height={size === 'sm' ? 14 : size === 'md' ? 16 : 18}
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </span>
        ) : (
          <span className={cn(selectIconVariants({ size }))} aria-hidden="true">
            <svg
              width={size === 'sm' ? 16 : size === 'md' ? 20 : 24}
              height={size === 'sm' ? 16 : size === 'md' ? 20 : 24}
              viewBox="0 0 20 20"
              fill="currentColor"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </span>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
