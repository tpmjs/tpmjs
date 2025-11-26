/**
 * Form-specific design tokens for TPMJS UI
 * Extends base tokens with form control sizing and spacing
 */

import { borderRadius } from './borders';
import { spacing } from './spacing';

/**
 * Form input and textarea heights
 * Consistent with Button component sizing
 */
export const formHeight = {
  sm: spacing[9], // 36px
  md: spacing[10], // 40px
  lg: spacing[11], // 44px
} as const;

/**
 * Form control sizes (checkbox, radio, switch thumb)
 * Square dimensions for checkboxes and radios
 */
export const formControl = {
  size: {
    sm: '16px',
    md: '20px',
    lg: '24px',
  },
} as const;

/**
 * Switch-specific dimensions
 * Width includes padding for thumb travel
 */
export const formSwitch = {
  sm: {
    width: '36px',
    height: '20px',
    thumb: '16px',
  },
  md: {
    width: '44px',
    height: '24px',
    thumb: '20px',
  },
  lg: {
    width: '56px',
    height: '28px',
    thumb: '24px',
  },
} as const;

/**
 * Slider dimensions
 * Track height and thumb size for range inputs
 */
export const formSlider = {
  track: {
    sm: '4px',
    md: '6px',
    lg: '8px',
  },
  thumb: {
    sm: '12px',
    md: '16px',
    lg: '20px',
  },
} as const;

/**
 * Form spacing
 * Consistent gaps between form elements
 */
export const formGap = {
  /** Gap between label and input */
  label: spacing[2], // 8px
  /** Gap between input and helper text */
  helper: spacing[1], // 4px
  /** Gap between input and error message */
  error: spacing[1.5], // 6px
  /** Gap between form fields in a group */
  field: spacing[4], // 16px
  /** Gap between radio/checkbox items in a group */
  group: spacing[2.5], // 10px
} as const;

/**
 * Form border radius
 * Specific radius values for different form controls
 */
export const formBorderRadius = {
  input: borderRadius.md,
  control: borderRadius.sm,
  switch: '999px', // Fully rounded pill shape
} as const;

/**
 * Focus ring configuration
 * Consistent focus indicators across all form controls
 */
export const formRing = {
  width: '2px',
  offset: '2px',
  color: 'hsl(var(--ring))',
  opacity: '0.2',
} as const;

/**
 * Transition configuration
 * Consistent animation timings for form interactions
 */
export const formTransition = {
  duration: {
    fast: '150ms',
    base: '200ms',
    slow: '300ms',
  },
  easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
} as const;

/**
 * Checkbox and Radio checkmark styling
 * SVG stroke configuration for animations
 */
export const formCheckmark = {
  strokeWidth: '2px',
  scale: {
    unchecked: '0',
    checked: '1',
  },
} as const;

/**
 * Complete form tokens export
 */
export const formTokens = {
  height: formHeight,
  control: formControl,
  switch: formSwitch,
  slider: formSlider,
  gap: formGap,
  borderRadius: formBorderRadius,
  ring: formRing,
  transition: formTransition,
  checkmark: formCheckmark,
} as const;
