'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export interface UseCountUpOptions {
  /**
   * Starting value
   * @default 0
   */
  start?: number;

  /**
   * Ending value (target)
   */
  end: number;

  /**
   * Duration of the animation in milliseconds
   * @default 2000
   */
  duration?: number;

  /**
   * Whether to start the animation immediately
   * @default false
   */
  autoStart?: boolean;

  /**
   * Easing function for the animation
   * @default 'easeOutExpo'
   */
  easing?: 'linear' | 'easeOutExpo' | 'easeOutQuad';

  /**
   * Number of decimal places
   * @default 0
   */
  decimals?: number;
}

// Easing functions
const easingFunctions = {
  linear: (t: number): number => t,
  easeOutExpo: (t: number): number => (t === 1 ? 1 : 1 - 2 ** (-10 * t)),
  easeOutQuad: (t: number): number => t * (2 - t),
};

/**
 * useCountUp Hook
 *
 * Animates a number from start to end using requestAnimationFrame.
 * Perfect for brutalist counter animations with precise control.
 *
 * @example
 * ```tsx
 * function Counter() {
 *   const { count, start } = useCountUp({ end: 1000, duration: 2000 });
 *
 *   useEffect(() => {
 *     start();
 *   }, [start]);
 *
 *   return <div className="text-6xl font-mono">{Math.floor(count)}</div>;
 * }
 * ```
 */
export function useCountUp(options: UseCountUpOptions): {
  count: number;
  start: () => void;
  reset: () => void;
  isAnimating: boolean;
} {
  const {
    start: startValue = 0,
    end,
    duration = 2000,
    autoStart = false,
    easing = 'easeOutExpo',
    decimals = 0,
  } = options;

  const [count, setCount] = useState(startValue);
  const [isAnimating, setIsAnimating] = useState(false);
  const hasStartedRef = useRef(false);
  const isAnimatingRef = useRef(false);

  const animate = useCallback((): void => {
    const startTime = Date.now();
    const endTime = startTime + duration;
    const range = end - startValue;
    const easingFn = easingFunctions[easing];

    const updateCount = (): void => {
      const now = Date.now();
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easingFn(progress);
      const currentCount = startValue + range * easedProgress;

      setCount(Number(currentCount.toFixed(decimals)));

      if (now < endTime) {
        requestAnimationFrame(updateCount);
      } else {
        setCount(Number(end.toFixed(decimals)));
        isAnimatingRef.current = false;
        setIsAnimating(false);
      }
    };

    isAnimatingRef.current = true;
    setIsAnimating(true);
    requestAnimationFrame(updateCount);
  }, [duration, end, startValue, easing, decimals]);

  const start = useCallback((): void => {
    if (!isAnimatingRef.current && !hasStartedRef.current) {
      hasStartedRef.current = true;
      animate();
    }
  }, [animate]);

  const reset = useCallback((): void => {
    setCount(startValue);
    hasStartedRef.current = false;
    isAnimatingRef.current = false;
    setIsAnimating(false);
  }, [startValue]);

  // Auto-start animation on mount if autoStart is true
  // Use requestAnimationFrame to defer the start call outside the effect's synchronous execution
  useEffect(() => {
    if (autoStart) {
      const frameId = requestAnimationFrame(() => {
        start();
      });
      return () => cancelAnimationFrame(frameId);
    }
  }, [autoStart, start]);

  return {
    count,
    start,
    reset,
    isAnimating,
  };
}
