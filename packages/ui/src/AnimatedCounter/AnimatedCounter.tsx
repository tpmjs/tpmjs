'use client';

import { cn } from '@tpmjs/utils/cn';
import { forwardRef, useEffect } from 'react';
import { useCountUp } from '../system/hooks/useCountUp';
import { useScrollReveal } from '../system/hooks/useScrollReveal';
import type { AnimatedCounterProps } from './types';
import { animatedCounterVariants } from './variants';

/**
 * AnimatedCounter component
 *
 * Displays an animated number counter with customizable formatting.
 * Can start animation on mount or when scrolled into viewport.
 *
 * @example
 * ```tsx
 * import { AnimatedCounter } from '@tpmjs/ui/AnimatedCounter/AnimatedCounter';
 *
 * function Stats() {
 *   return (
 *     <div>
 *       <AnimatedCounter value={2847} suffix=" Tools" size="xl" />
 *       <AnimatedCounter value={12000000} suffix="+" prefix="" size="lg" />
 *     </div>
 *   );
 * }
 * ```
 */
export const AnimatedCounter = forwardRef<HTMLSpanElement, AnimatedCounterProps>(
  (
    {
      className,
      value,
      duration = 2000,
      decimals = 0,
      prefix = '',
      suffix = '',
      separator = '',
      startOn = 'viewport',
      easing = 'easeOutExpo',
      size = 'md',
      mono = true,
      ...props
    },
    ref
  ) => {
    const { count, start } = useCountUp({
      end: value,
      duration,
      decimals,
      easing,
      autoStart: startOn === 'mount',
    });

    const { ref: scrollRef, isVisible } = useScrollReveal({
      threshold: 0.2,
      once: true,
    });

    // Start animation when element becomes visible (if startOn === 'viewport')
    useEffect(() => {
      if (startOn === 'viewport' && isVisible) {
        start();
      }
    }, [isVisible, start, startOn]);

    // Format number with separator if provided
    const formatNumber = (num: number): string => {
      const numStr = num.toFixed(decimals);
      if (!separator) return numStr;

      const parts = numStr.split('.');
      const intPart = parts[0];
      const decPart = parts[1];
      const formattedInt = intPart ? intPart.replace(/\B(?=(\d{3})+(?!\d))/g, separator) : '';
      return decPart ? `${formattedInt}.${decPart}` : formattedInt;
    };

    const formattedValue = formatNumber(count);

    return (
      <span
        ref={(node) => {
          // Assign to both refs - this is a standard ref callback pattern for merging refs
          if (scrollRef) {
            // eslint-disable-next-line react-hooks/immutability
            (scrollRef as React.MutableRefObject<HTMLSpanElement | null>).current = node;
          }
          if (typeof ref === 'function') {
            ref(node);
          } else if (ref) {
            ref.current = node;
          }
        }}
        className={cn(
          animatedCounterVariants({
            size,
            mono: mono ? 'true' : 'false',
          }),
          className
        )}
        aria-label={`${prefix}${value}${suffix}`}
        {...props}
      >
        {prefix}
        {formattedValue}
        {suffix}
      </span>
    );
  }
);

AnimatedCounter.displayName = 'AnimatedCounter';
