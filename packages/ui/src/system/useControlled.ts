import { useCallback, useRef, useState } from 'react';

/**
 * Hook for managing controlled and uncontrolled component state.
 *
 * This hook implements the controlled/uncontrolled component pattern,
 * allowing components to work in both modes seamlessly.
 *
 * @example
 * ```tsx
 * function MyInput({ value, defaultValue, onChange }) {
 *   const [inputValue, setInputValue] = useControlled({
 *     controlled: value,
 *     default: defaultValue ?? '',
 *     name: 'MyInput',
 *   });
 *
 *   const handleChange = (e) => {
 *     setInputValue(e.target.value);
 *     onChange?.(e.target.value);
 *   };
 *
 *   return <input value={inputValue} onChange={handleChange} />;
 * }
 * ```
 *
 * @param params - Configuration object
 * @param params.controlled - The controlled value from props
 * @param params.default - The default value for uncontrolled mode
 * @param params.name - Component name for dev warnings
 * @returns A tuple of [value, setValue] similar to useState
 */
export function useControlled<T>({
  controlled,
  default: defaultValue,
  name,
}: {
  controlled: T | undefined;
  default: T | undefined;
  name: string;
}): [T, (newValue: T) => void] {
  // Check if the component is controlled
  const { current: isControlled } = useRef(controlled !== undefined);

  // Internal state for uncontrolled mode
  const [valueState, setValue] = useState(defaultValue);

  // Use controlled value if provided, otherwise use internal state
  const value = isControlled ? controlled : valueState;

  // Dev warning for switching between controlled and uncontrolled
  if (process.env.NODE_ENV !== 'production') {
    // biome-ignore lint/correctness/useHookAtTopLevel: dev-only warning
    useRef(() => {
      if (isControlled !== (controlled !== undefined)) {
        console.error(
          `Warning: A component (\`${name}\`) is changing from ${
            isControlled ? 'controlled' : 'uncontrolled'
          } to ${isControlled ? 'uncontrolled' : 'controlled'}. ` +
            'Components should not switch from controlled to uncontrolled (or vice versa). ' +
            'Decide between using a controlled or uncontrolled component for the lifetime of the component.'
        );
      }
    });
  }

  // Callback to update the value
  const setValueIfUncontrolled = useCallback(
    (newValue: T) => {
      if (!isControlled) {
        setValue(newValue);
      }
    },
    [isControlled]
  );

  return [value as T, setValueIfUncontrolled];
}
