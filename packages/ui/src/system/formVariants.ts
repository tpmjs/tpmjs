/**
 * Shared variant base classes for form components
 * These base classes ensure consistency across all form inputs and controls
 */

/**
 * Base classes for text-based form inputs
 * Shared across Input, Textarea, and Select components
 */
export const formInputBase = [
  // Layout
  'flex w-full',
  // Typography
  'font-sans text-base',
  // Borders and radius
  'rounded-md border border-border',
  // Colors
  'bg-background text-foreground',
  // Placeholder
  'placeholder:text-foreground-tertiary',
  // Transitions
  'transition-base',
  // Focus state
  'focus-ring',
  // Hover state
  'hover:border-border-strong',
  // Disabled state
  'disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-border',
  // Read-only state
  'read-only:cursor-default read-only:focus:ring-0',
].join(' ');

/**
 * Base classes for form controls
 * Shared across Checkbox, Radio, and Switch components
 */
export const formControlBase = [
  // Remove default appearance
  'appearance-none',
  // Cursor
  'cursor-pointer',
  // Transitions
  'transition-base',
  // Disabled state
  'disabled:cursor-not-allowed disabled:opacity-50',
].join(' ');

/**
 * Error state classes
 * Applied when a form field has validation errors
 */
export const formErrorState = ['border-error', 'focus:border-error', 'focus:ring-error/20'].join(
  ' '
);

/**
 * Success state classes
 * Applied when a form field has been validated successfully
 */
export const formSuccessState = [
  'border-success',
  'focus:border-success',
  'focus:ring-success/20',
].join(' ');

/**
 * Loading state classes
 * Applied when a form field is in loading state
 */
export const formLoadingState = ['cursor-wait', 'pointer-events-none', 'opacity-70'].join(' ');

/**
 * Helper text base classes
 * For error messages, helper text, and field descriptions
 */
export const formHelperBase = ['text-sm text-foreground-secondary', 'mt-1.5'].join(' ');

/**
 * Error message classes
 * Extends helper base with error-specific styling
 */
export const formErrorMessage = ['text-sm text-error', 'mt-1.5'].join(' ');

/**
 * Label base classes
 * For form field labels
 */
export const formLabelBase = ['text-sm font-medium text-foreground', 'mb-2', 'inline-block'].join(
  ' '
);

/**
 * Required indicator classes
 * For asterisk on required fields
 */
export const formRequiredIndicator = ['text-error', 'ml-0.5'].join(' ');
