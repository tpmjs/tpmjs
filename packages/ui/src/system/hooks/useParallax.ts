'use client';

import { useEffect, useState } from 'react';

export interface UseParallaxOptions {
  /**
   * Speed multiplier for parallax effect
   * - 1 = normal scroll speed
   * - 0.5 = half scroll speed (slower, moves less)
   * - 2 = double scroll speed (faster, moves more)
   * @default 0.5
   */
  speed?: number;

  /**
   * Whether to enable the parallax effect
   * @default true
   */
  enabled?: boolean;
}

/**
 * useParallax Hook
 *
 * Creates a parallax scroll effect by tracking scroll position and applying
 * a transform based on the speed multiplier. Optimized with requestAnimationFrame.
 *
 * @example
 * ```tsx
 * function HeroSection() {
 *   const parallaxStyle = useParallax({ speed: 0.5 });
 *
 *   return (
 *     <div style={parallaxStyle} className="hero">
 *       Content moves slower than scroll
 *     </div>
 *   );
 * }
 * ```
 */
export function useParallax(options: UseParallaxOptions = {}): React.CSSProperties {
  const { speed = 0.5, enabled = true } = options;

  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    if (!enabled) return;

    let ticking = false;

    const handleScroll = (): void => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setScrollY(window.scrollY);
          ticking = false;
        });
        ticking = true;
      }
    };

    // Initial scroll position - intentional initial sync from browser API
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setScrollY(window.scrollY);

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [enabled]);

  if (!enabled) {
    return {};
  }

  // Calculate transform based on scroll position and speed
  // Negative speed values create reverse parallax
  const translateY = scrollY * (1 - speed);

  return {
    transform: `translateY(${translateY}px)`,
    willChange: 'transform',
  };
}
