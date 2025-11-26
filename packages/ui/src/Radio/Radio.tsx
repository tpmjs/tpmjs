import { cn } from '@tpmjs/utils/cn';
import { forwardRef } from 'react';
import { useRadioGroup } from './RadioGroup';
import type { RadioProps } from './types';
import { radioDotVariants, radioLabelVariants, radioUIVariants, radioVariants } from './variants';

/**
 * Radio component
 *
 * A custom-styled radio button that must be used within a RadioGroup.
 * Provides visual feedback with an animated inner dot.
 *
 * @example
 * ```tsx
 * import { RadioGroup } from '@tpmjs/ui/Radio/RadioGroup';
 * import { Radio } from '@tpmjs/ui/Radio/Radio';
 *
 * function MyComponent() {
 *   return (
 *     <RadioGroup name="size" defaultValue="medium">
 *       <Radio value="small" label="Small" />
 *       <Radio value="medium" label="Medium" />
 *       <Radio value="large" label="Large" />
 *     </RadioGroup>
 *   );
 * }
 * ```
 */
export const Radio = forwardRef<HTMLInputElement, RadioProps>(
  (
    {
      className,
      state: stateProp,
      size: sizeProp,
      label,
      labelPosition = 'right',
      disabled: disabledProp,
      value,
      id,
      ...props
    },
    ref
  ) => {
    // Get context from RadioGroup
    const context = useRadioGroup();

    // Merge props with context (props take precedence)
    const state = stateProp ?? context.state ?? 'default';
    const size = sizeProp ?? context.size ?? 'md';
    const disabled = disabledProp ?? context.disabled ?? false;
    const name = context.name;
    const groupValue = context.value;
    const onChange = context.onChange;

    // Determine if this radio is checked
    const checked = value !== undefined && value === groupValue;

    // Generate unique ID if not provided
    const radioId = id || `radio-${name}-${value}`;

    const handleChange = () => {
      if (value !== undefined && !disabled) {
        onChange?.(String(value));
      }
    };

    const radioInput = (
      <input
        ref={ref}
        type="radio"
        id={radioId}
        name={name}
        value={value}
        checked={checked}
        onChange={handleChange}
        className={cn(radioVariants({ state, size }), className)}
        disabled={disabled}
        {...props}
      />
    );

    const radioUI = (
      <span className={cn(radioUIVariants({ state, size }))}>
        {/* Inner dot (shown when checked) */}
        <span className={cn(radioDotVariants({ state, size }))} />
      </span>
    );

    const labelElement = label ? (
      <label
        htmlFor={radioId}
        className={cn(radioLabelVariants({ size }), labelPosition === 'left' ? 'mr-2' : 'ml-2')}
      >
        {label}
      </label>
    ) : null;

    return (
      <div className={cn('inline-flex items-center', disabled && 'cursor-not-allowed')}>
        {labelPosition === 'left' && labelElement}
        <div className="relative inline-flex">
          {radioInput}
          {radioUI}
        </div>
        {labelPosition === 'right' && labelElement}
      </div>
    );
  }
);

Radio.displayName = 'Radio';
