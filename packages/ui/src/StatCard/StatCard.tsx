'use client';

import { cn } from '@tpmjs/utils/cn';
import { forwardRef } from 'react';
import { AnimatedCounter } from '../AnimatedCounter/AnimatedCounter';
import { useScrollReveal } from '../system/hooks/useScrollReveal';
import type { StatCardProps } from './types';
import {
  statCardVariants,
  statLabelVariants,
  statSubtextVariants,
  statValueVariants,
} from './variants';

/**
 * StatCard component
 *
 * Displays a statistic with animated counter and optional bar chart.
 * Perfect for brutalist dashboards and metrics display.
 *
 * @example
 * ```tsx
 * import { StatCard } from '@tpmjs/ui/StatCard/StatCard';
 *
 * function Dashboard() {
 *   return (
 *     <div className="grid grid-cols-4 gap-4">
 *       <StatCard
 *         value={2847}
 *         label="Published Tools"
 *         subtext="Across 24 categories"
 *         variant="brutalist"
 *         showBar
 *         barProgress={85}
 *       />
 *       <StatCard
 *         value={48000}
 *         suffix="+"
 *         label="Active Developers"
 *         variant="default"
 *       />
 *     </div>
 *   );
 * }
 * ```
 */
export const StatCard = forwardRef<HTMLDivElement, StatCardProps>(
  (
    {
      className,
      value,
      label,
      subtext,
      prefix = '',
      suffix = '',
      separator = ',',
      variant = 'default',
      size = 'md',
      showBar = false,
      barProgress = 80,
      ...props
    },
    ref
  ) => {
    const { ref: scrollRef, isVisible } = useScrollReveal({
      threshold: 0.2,
      once: true,
    });

    return (
      <div
        ref={(node) => {
          // Assign to both refs - this is a standard ref callback pattern for merging refs
          if (scrollRef) {
            // eslint-disable-next-line react-hooks/immutability
            (scrollRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
          }
          if (typeof ref === 'function') {
            ref(node);
          } else if (ref) {
            ref.current = node;
          }
        }}
        className={cn(
          statCardVariants({
            variant,
            size,
          }),
          className
        )}
        {...props}
      >
        {/* Value */}
        <div className={statValueVariants({ size })}>
          <AnimatedCounter
            value={value}
            prefix={prefix}
            suffix={suffix}
            separator={separator}
            duration={2000}
            startOn="viewport"
            easing="easeOutExpo"
          />
        </div>

        {/* Label */}
        <div className={cn(statLabelVariants({ size }), 'mt-2')}>{label}</div>

        {/* Subtext */}
        {subtext && <div className={cn(statSubtextVariants({ size }), 'mt-1')}>{subtext}</div>}

        {/* Optional Bar Chart */}
        {showBar && (
          <div className="mt-4 h-2 w-full bg-muted overflow-hidden">
            <div
              className={cn(
                'h-full bg-brutalist-accent transition-all duration-1000 ease-out',
                isVisible ? 'w-full' : 'w-0'
              )}
              style={{
                width: isVisible ? `${barProgress}%` : '0%',
              }}
            />
          </div>
        )}
      </div>
    );
  }
);

StatCard.displayName = 'StatCard';
