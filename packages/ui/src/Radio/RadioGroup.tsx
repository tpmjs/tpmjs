import { cn } from '@tpmjs/utils/cn';
import { createContext, useContext, useEffect } from 'react';
import { useControlled } from '../system/useControlled';
import type { RadioGroupContextValue, RadioGroupProps } from './types';
import { radioGroupVariants } from './variants';

/**
 * Context for RadioGroup to share state with Radio children
 */
export const RadioGroupContext = createContext<RadioGroupContextValue | null>(null);

/**
 * Hook to access RadioGroup context
 */
export const useRadioGroup = () => {
  const context = useContext(RadioGroupContext);
  if (!context) {
    // Return default values for SSR and hydration compatibility
    // This prevents hydration mismatches while allowing the component to render
    return {
      name: '',
      value: undefined,
      onChange: () => {},
      state: 'default' as const,
      size: 'md' as const,
      disabled: false,
    };
  }
  return context;
};

/**
 * RadioGroup component
 *
 * A container for Radio components that manages selection state,
 * keyboard navigation, and ARIA attributes.
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
 *
 * @example
 * ```tsx
 * // Controlled mode
 * const [size, setSize] = useState('medium');
 * <RadioGroup name="size" value={size} onChange={setSize}>
 *   <Radio value="small" label="Small" />
 *   <Radio value="medium" label="Medium" />
 *   <Radio value="large" label="Large" />
 * </RadioGroup>
 * ```
 */
export function RadioGroup({
  name,
  value: valueProp,
  defaultValue,
  onChange,
  orientation = 'vertical',
  state = 'default',
  size = 'md',
  disabled = false,
  children,
  className,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  'aria-describedby': ariaDescribedBy,
  required = false,
}: RadioGroupProps) {
  const [value, setValue] = useControlled({
    controlled: valueProp,
    default: defaultValue,
    name: 'RadioGroup',
  });

  const handleChange = (newValue: string) => {
    setValue(newValue);
    onChange?.(newValue);
  };

  const contextValue: RadioGroupContextValue = {
    name,
    value,
    onChange: handleChange,
    state,
    size,
    disabled,
  };

  return (
    <RadioGroupContext.Provider value={contextValue}>
      <div
        role="radiogroup"
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        aria-describedby={ariaDescribedBy}
        aria-required={required}
        className={cn(radioGroupVariants({ orientation }), className)}
      >
        {children}
      </div>
    </RadioGroupContext.Provider>
  );
}

RadioGroup.displayName = 'RadioGroup';
