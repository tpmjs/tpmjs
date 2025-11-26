import { cn } from '@tpmjs/utils/cn';
import { forwardRef, useMemo } from 'react';
import type { SliderProps } from './types';
import {
  sliderMarkVariants,
  sliderMarksVariants,
  sliderValueVariants,
  sliderVariants,
} from './variants';

/**
 * Slider component
 *
 * A native range input with custom styling, support for marks, value display,
 * and full accessibility.
 *
 * @example
 * ```tsx
 * import { Slider } from '@tpmjs/ui/Slider/Slider';
 *
 * function MyComponent() {
 *   return (
 *     <Slider
 *       min={0}
 *       max={100}
 *       defaultValue={50}
 *       showValue
 *     />
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // With custom marks
 * const marks = [
 *   { value: 0, label: 'Min' },
 *   { value: 50, label: 'Mid' },
 *   { value: 100, label: 'Max' },
 * ];
 *
 * <Slider min={0} max={100} marks={marks} />
 * ```
 */
export const Slider = forwardRef<HTMLInputElement, SliderProps>(
  (
    {
      className,
      min = 0,
      max = 100,
      step = 1,
      state = 'default',
      size = 'md',
      showValue = false,
      showMarks = false,
      marks,
      fullWidth = true,
      value,
      defaultValue,
      disabled = false,
      ...props
    },
    ref
  ) => {
    // Get current value for display
    const currentValue = value ?? defaultValue ?? min;

    // Generate marks if showMarks is true and marks not provided
    const displayMarks = useMemo(() => {
      if (marks) return marks;
      if (!showMarks) return [];

      // Generate marks at each step
      const generatedMarks: Array<{ value: number; label?: string }> = [];
      for (let i = min; i <= max; i += step) {
        generatedMarks.push({ value: i });
      }
      return generatedMarks;
    }, [marks, showMarks, min, max, step]);

    // Calculate percentage for positioning marks
    const getMarkPosition = (markValue: number) => {
      return ((markValue - min) / (max - min)) * 100;
    };

    return (
      <div className={cn('inline-flex flex-col', fullWidth && 'w-full')}>
        <div className={cn('inline-flex items-center', fullWidth && 'w-full')}>
          {/* Custom styled slider using CSS */}
          <div className={cn('relative flex items-center', fullWidth && 'w-full')}>
            <input
              ref={ref}
              type="range"
              min={min}
              max={max}
              step={step}
              value={value}
              defaultValue={defaultValue ?? (value === undefined ? min : undefined)}
              disabled={disabled}
              className={cn(
                sliderVariants({ state, size, fullWidth: fullWidth ? 'true' : 'false' }),
                className
              )}
              style={{
                // Track styles
                background: `linear-gradient(to right, hsl(var(--primary)) 0%, hsl(var(--primary)) ${((Number(currentValue) - min) / (max - min)) * 100}%, hsl(var(--border)) ${((Number(currentValue) - min) / (max - min)) * 100}%, hsl(var(--border)) 100%)`,
              }}
              aria-valuemin={min}
              aria-valuemax={max}
              aria-valuenow={Number(currentValue)}
              aria-invalid={state === 'error' ? 'true' : undefined}
              {...props}
            />
          </div>

          {/* Value display */}
          {showValue && (
            <span className={cn(sliderValueVariants({ size }))} aria-live="polite">
              {currentValue}
            </span>
          )}
        </div>

        {/* Marks */}
        {displayMarks.length > 0 && (
          <div className={cn(sliderMarksVariants({ size }))}>
            {displayMarks.map((mark) => (
              <div
                key={mark.value}
                className={cn(sliderMarkVariants({ size }))}
                style={{ left: `${getMarkPosition(mark.value)}%` }}
              >
                {mark.label || mark.value}
              </div>
            ))}
          </div>
        )}

        {/* Inline styles for cross-browser slider styling */}
        <style>
          {`
            /* Base slider styles */
            input[type="range"] {
              -webkit-appearance: none;
              appearance: none;
              height: ${size === 'sm' ? '16px' : size === 'md' ? '20px' : '24px'};
            }

            /* Track */
            input[type="range"]::-webkit-slider-runnable-track {
              width: 100%;
              height: ${size === 'sm' ? '4px' : size === 'md' ? '6px' : '8px'};
              cursor: pointer;
              border-radius: 9999px;
              border: none;
            }

            input[type="range"]::-moz-range-track {
              width: 100%;
              height: ${size === 'sm' ? '4px' : size === 'md' ? '6px' : '8px'};
              cursor: pointer;
              border-radius: 9999px;
              border: none;
              background: transparent;
            }

            /* Thumb */
            input[type="range"]::-webkit-slider-thumb {
              -webkit-appearance: none;
              appearance: none;
              ${size === 'sm' ? 'height: 16px; width: 16px;' : ''}
              ${size === 'md' ? 'height: 20px; width: 20px;' : ''}
              ${size === 'lg' ? 'height: 24px; width: 24px;' : ''}
              border-radius: 50%;
              background: hsl(var(--${state === 'error' ? 'error' : state === 'success' ? 'success' : 'primary'}));
              cursor: pointer;
              border: 2px solid hsl(var(--background));
              box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
              transition: all 200ms ease-in-out;
              margin-top: -${size === 'sm' ? '6' : size === 'md' ? '7' : '8'}px;
            }

            input[type="range"]::-moz-range-thumb {
              ${size === 'sm' ? 'height: 16px; width: 16px;' : ''}
              ${size === 'md' ? 'height: 20px; width: 20px;' : ''}
              ${size === 'lg' ? 'height: 24px; width: 24px;' : ''}
              border-radius: 50%;
              background: hsl(var(--${state === 'error' ? 'error' : state === 'success' ? 'success' : 'primary'}));
              cursor: pointer;
              border: 2px solid hsl(var(--background));
              box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
              transition: all 200ms ease-in-out;
            }

            /* Hover */
            input[type="range"]:not(:disabled):hover::-webkit-slider-thumb {
              transform: scale(1.1);
            }

            input[type="range"]:not(:disabled):hover::-moz-range-thumb {
              transform: scale(1.1);
            }

            /* Focus */
            input[type="range"]:focus::-webkit-slider-thumb {
              outline: none;
              ring: 2px;
              ring-color: hsl(var(--${state === 'error' ? 'error' : state === 'success' ? 'success' : 'primary'})) / 0.2;
            }

            input[type="range"]:focus::-moz-range-thumb {
              outline: none;
              box-shadow: 0 0 0 2px hsl(var(--${state === 'error' ? 'error' : state === 'success' ? 'success' : 'primary'})) / 0.2;
            }

            /* Active */
            input[type="range"]:active::-webkit-slider-thumb {
              transform: scale(1.15);
            }

            input[type="range"]:active::-moz-range-thumb {
              transform: scale(1.15);
            }

            /* Disabled */
            input[type="range"]:disabled::-webkit-slider-runnable-track {
              cursor: not-allowed;
            }

            input[type="range"]:disabled::-moz-range-track {
              cursor: not-allowed;
            }

            input[type="range"]:disabled::-webkit-slider-thumb {
              cursor: not-allowed;
            }

            input[type="range"]:disabled::-moz-range-thumb {
              cursor: not-allowed;
            }
          `}
        </style>
      </div>
    );
  }
);

Slider.displayName = 'Slider';
