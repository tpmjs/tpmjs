import { cn } from '@tpmjs/utils/cn';
import type { FormFieldProps } from './types';
import {
  formFieldErrorVariants,
  formFieldHelperVariants,
  formFieldLabelVariants,
  formFieldRequiredVariants,
  formFieldVariants,
} from './variants';

/**
 * FormField component
 *
 * A composition component that wraps form controls with label, error message,
 * and helper text. Provides consistent spacing, accessibility, and styling.
 *
 * @example
 * ```tsx
 * import { FormField } from '@tpmjs/ui/FormField/FormField';
 * import { Input } from '@tpmjs/ui/Input/Input';
 *
 * function MyComponent() {
 *   return (
 *     <FormField
 *       label="Email"
 *       htmlFor="email"
 *       required
 *       helperText="We'll never share your email"
 *     >
 *       <Input id="email" type="email" />
 *     </FormField>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // With error message
 * <FormField
 *   label="Username"
 *   htmlFor="username"
 *   error="Username is already taken"
 *   state="error"
 * >
 *   <Input id="username" state="error" />
 * </FormField>
 * ```
 *
 * @example
 * ```tsx
 * // Horizontal layout
 * <FormField
 *   label="Subscribe"
 *   htmlFor="subscribe"
 *   orientation="horizontal"
 * >
 *   <Checkbox id="subscribe" />
 * </FormField>
 * ```
 */
export function FormField({
  label,
  htmlFor,
  required = false,
  error,
  helperText,
  state = 'default',
  disabled = false,
  children,
  orientation = 'vertical',
  className,
  ...props
}: FormFieldProps) {
  // Determine effective state (error takes precedence)
  const effectiveState = error ? 'error' : state;

  // Generate IDs for aria-describedby
  const helperId = helperText || error ? `${htmlFor}-description` : undefined;

  return (
    <div
      className={cn(
        formFieldVariants({
          orientation,
          disabled: disabled ? 'true' : 'false',
        }),
        className
      )}
      {...props}
    >
      {/* Label */}
      {label && (
        <label
          htmlFor={htmlFor}
          className={cn(
            formFieldLabelVariants({
              state: effectiveState,
              disabled: disabled ? 'true' : 'false',
            })
          )}
        >
          {label}
          {required && (
            <span className={cn(formFieldRequiredVariants())} aria-label="required">
              *
            </span>
          )}
        </label>
      )}

      {/* Form control */}
      <div className={cn(orientation === 'vertical' ? 'w-full' : 'flex-1')}>
        {children}

        {/* Error message (takes precedence over helper text) */}
        {error && (
          <div
            id={helperId}
            className={cn(formFieldErrorVariants())}
            role="alert"
            aria-live="polite"
          >
            {error}
          </div>
        )}

        {/* Helper text (shown only if no error) */}
        {!error && helperText && (
          <div id={helperId} className={cn(formFieldHelperVariants({ state: effectiveState }))}>
            {helperText}
          </div>
        )}
      </div>
    </div>
  );
}

FormField.displayName = 'FormField';
