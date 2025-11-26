import { cn } from '@tpmjs/utils/cn';
import { forwardRef } from 'react';
import { useControlled } from '../system/useControlled';
import type { SwitchProps } from './types';
import {
  switchLabelVariants,
  switchSpinnerVariants,
  switchThumbVariants,
  switchVariants,
} from './variants';

/**
 * Switch component
 *
 * A toggle switch component with animated thumb transition.
 * Supports controlled/uncontrolled modes, loading states, and accessibility.
 *
 * @example
 * ```tsx
 * import { Switch } from '@tpmjs/ui/Switch/Switch';
 *
 * function MyComponent() {
 *   return (
 *     <Switch
 *       label="Enable notifications"
 *       defaultChecked={false}
 *     />
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Controlled mode with loading state
 * const [enabled, setEnabled] = useState(false);
 * const [loading, setLoading] = useState(false);
 *
 * const handleChange = async (checked: boolean) => {
 *   setLoading(true);
 *   await savePreference(checked);
 *   setEnabled(checked);
 *   setLoading(false);
 * };
 *
 * <Switch
 *   checked={enabled}
 *   onChange={handleChange}
 *   loading={loading}
 *   label="Auto-save"
 * />
 * ```
 */
export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(
  (
    {
      className,
      checked: checkedProp,
      defaultChecked = false,
      onChange,
      state = 'default',
      size = 'md',
      label,
      labelPosition = 'right',
      loading = false,
      disabled = false,
      name,
      value,
      id,
      ...props
    },
    ref
  ) => {
    const [checked, setChecked] = useControlled({
      controlled: checkedProp,
      default: defaultChecked,
      name: 'Switch',
    });

    const handleClick = () => {
      if (!disabled && !loading) {
        const newChecked = !checked;
        setChecked(newChecked);
        onChange?.(newChecked);
      }
    };

    // Generate unique ID if not provided
    const switchId = id || `switch-${Math.random().toString(36).substring(2, 9)}`;

    // Determine data-state for styling
    const dataState = checked ? 'checked' : 'unchecked';

    const switchButton = (
      <button
        ref={ref}
        type="button"
        role="switch"
        id={switchId}
        aria-checked={checked}
        aria-label={!label ? props['aria-label'] : undefined}
        aria-labelledby={label ? `${switchId}-label` : props['aria-labelledby']}
        data-state={dataState}
        className={cn(
          switchVariants({ state, size, loading: loading ? 'true' : 'false' }),
          className
        )}
        disabled={disabled || loading}
        onClick={handleClick}
        {...props}
      >
        {/* Hidden input for form submission */}
        {name && (
          <input
            type="checkbox"
            name={name}
            value={value}
            checked={checked}
            onChange={() => {}}
            tabIndex={-1}
            aria-hidden="true"
            style={{
              position: 'absolute',
              width: '1px',
              height: '1px',
              padding: 0,
              margin: '-1px',
              overflow: 'hidden',
              clip: 'rect(0, 0, 0, 0)',
              whiteSpace: 'nowrap',
              borderWidth: 0,
            }}
          />
        )}

        {/* Animated thumb */}
        <span
          className={cn(switchThumbVariants({ size }))}
          data-state={dataState}
          aria-hidden="true"
        >
          {/* Loading spinner */}
          {loading && (
            <span className={cn(switchSpinnerVariants({ size }))}>
              <svg
                className="animate-spin"
                width={size === 'sm' ? 10 : size === 'md' ? 12 : 14}
                height={size === 'sm' ? 10 : size === 'md' ? 12 : 14}
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
          )}
        </span>
      </button>
    );

    const labelElement = label ? (
      <label
        id={`${switchId}-label`}
        htmlFor={switchId}
        className={cn(
          switchLabelVariants({ size }),
          labelPosition === 'left' ? 'mr-2' : 'ml-2',
          (disabled || loading) && 'cursor-not-allowed opacity-50'
        )}
      >
        {label}
      </label>
    ) : null;

    return (
      <div
        className={cn('inline-flex items-center', (disabled || loading) && 'cursor-not-allowed')}
      >
        {labelPosition === 'left' && labelElement}
        {switchButton}
        {labelPosition === 'right' && labelElement}
      </div>
    );
  }
);

Switch.displayName = 'Switch';
