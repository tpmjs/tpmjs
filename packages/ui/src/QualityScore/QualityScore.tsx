'use client';

import { cn } from '@tpmjs/utils/cn';
import { forwardRef, useMemo } from 'react';
import type { QualityScoreBreakdown, QualityScoreProps, QualityTier } from './types';
import {
  qualityScoreBarFillVariants,
  qualityScoreBarVariants,
  qualityScoreBreakdownRowVariants,
  qualityScoreBreakdownVariants,
  qualityScoreCircleVariants,
  qualityScoreTierVariants,
  qualityScoreVariants,
} from './variants';

/**
 * Get tier from score percentage
 */
function getTierFromScore(score: number): QualityTier {
  if (score >= 80) return 'excellent';
  if (score >= 60) return 'good';
  if (score >= 40) return 'fair';
  return 'poor';
}

/**
 * Get tier label
 */
function getTierLabel(tier: QualityTier): string {
  switch (tier) {
    case 'excellent':
      return 'Excellent';
    case 'good':
      return 'Good';
    case 'fair':
      return 'Fair';
    case 'poor':
      return 'Poor';
  }
}

/**
 * Breakdown category labels
 */
const BREAKDOWN_LABELS: Record<keyof QualityScoreBreakdown, string> = {
  documentation: 'Docs',
  maintenance: 'Maintenance',
  popularity: 'Popularity',
  security: 'Security',
  tests: 'Tests',
};

/**
 * QualityScore component
 *
 * A component for displaying quality scores with visual indicators.
 *
 * @example
 * ```tsx
 * import { QualityScore } from '@tpmjs/ui/QualityScore/QualityScore';
 *
 * function MyComponent() {
 *   return (
 *     <QualityScore
 *       score={85}
 *       variant="badge"
 *       showTier
 *     />
 *   );
 * }
 * ```
 */
export const QualityScore = forwardRef<HTMLDivElement, QualityScoreProps>(
  (
    {
      score,
      isDecimal = false,
      size = 'md',
      variant = 'default',
      showTier = true,
      showScore = true,
      tierLabel: customTierLabel,
      breakdown,
      className,
      ...props
    },
    ref
  ) => {
    // Normalize score to percentage
    const normalizedScore = useMemo(() => {
      if (isDecimal) {
        return Math.round(score * 100);
      }
      return Math.round(score);
    }, [score, isDecimal]);

    const tier = getTierFromScore(normalizedScore);
    const tierLabel = customTierLabel || getTierLabel(tier);

    // Badge variant
    if (variant === 'badge') {
      return (
        <div
          ref={ref}
          className={cn(qualityScoreVariants({ variant, size }), className)}
          {...props}
        >
          <div
            className={qualityScoreCircleVariants({ size, tier })}
            style={{ width: 'auto', height: 'auto', padding: '0.25rem 0.5rem', borderRadius: 0 }}
          >
            {showScore && normalizedScore}
          </div>
          {showTier && (
            <span className={qualityScoreTierVariants({ size, tier })}>
              {tierLabel}
            </span>
          )}
        </div>
      );
    }

    // Inline variant
    if (variant === 'inline') {
      return (
        <div
          ref={ref}
          className={cn(qualityScoreVariants({ variant, size }), className)}
          {...props}
        >
          {showScore && (
            <span className={qualityScoreTierVariants({ size, tier })}>
              {normalizedScore}
            </span>
          )}
          {showTier && (
            <span className="text-foreground-muted">
              ({tierLabel})
            </span>
          )}
        </div>
      );
    }

    // Detailed variant
    if (variant === 'detailed') {
      return (
        <div
          ref={ref}
          className={cn(qualityScoreVariants({ variant, size }), className)}
          {...props}
        >
          {/* Main score display */}
          <div className="flex items-center gap-2">
            <div className={qualityScoreCircleVariants({ size, tier })}>
              {showScore && normalizedScore}
            </div>
            <div className="flex flex-col">
              {showTier && (
                <span className={qualityScoreTierVariants({ size, tier })}>
                  {tierLabel}
                </span>
              )}
              {showScore && (
                <span className="text-foreground-muted text-xs">
                  out of 100
                </span>
              )}
            </div>
          </div>

          {/* Breakdown */}
          {breakdown && (
            <div className={qualityScoreBreakdownVariants({})}>
              {(Object.keys(breakdown) as Array<keyof QualityScoreBreakdown>).map(
                (key) => {
                  const value = breakdown[key];
                  if (value === undefined) return null;

                  const percentage = Math.round(value * 100);
                  const breakdownTier = getTierFromScore(percentage);

                  return (
                    <div
                      key={key}
                      className={qualityScoreBreakdownRowVariants({ size })}
                    >
                      <span className="w-20 text-right">
                        {BREAKDOWN_LABELS[key]}
                      </span>
                      <div className={qualityScoreBarVariants({ size })}>
                        <div
                          className={qualityScoreBarFillVariants({ tier: breakdownTier })}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="w-8 text-right">{percentage}</span>
                    </div>
                  );
                }
              )}
            </div>
          )}
        </div>
      );
    }

    // Default variant
    return (
      <div
        ref={ref}
        className={cn(qualityScoreVariants({ variant, size }), className)}
        {...props}
      >
        <div className={qualityScoreCircleVariants({ size, tier })}>
          {showScore && normalizedScore}
        </div>
        {showTier && (
          <div className="flex flex-col">
            <span className={qualityScoreTierVariants({ size, tier })}>
              {tierLabel}
            </span>
            <div className={qualityScoreBarVariants({ size })}>
              <div
                className={qualityScoreBarFillVariants({ tier })}
                style={{ width: `${normalizedScore}%` }}
              />
            </div>
          </div>
        )}
      </div>
    );
  }
);

QualityScore.displayName = 'QualityScore';
