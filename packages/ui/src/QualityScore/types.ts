import type { HTMLAttributes } from 'react';

/**
 * Quality tier types
 */
export type QualityTier = 'excellent' | 'good' | 'fair' | 'poor';

/**
 * QualityScore size types
 */
export type QualityScoreSize = 'sm' | 'md' | 'lg';

/**
 * QualityScore variant types
 */
export type QualityScoreVariant = 'default' | 'badge' | 'inline' | 'detailed';

/**
 * QualityScore component props
 */
export interface QualityScoreProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Score value (0-100 or 0-1)
   */
  score: number;

  /**
   * Whether score is in decimal format (0-1) vs percentage (0-100)
   * @default false
   */
  isDecimal?: boolean;

  /**
   * Size variant
   * @default 'md'
   */
  size?: QualityScoreSize;

  /**
   * Visual variant
   * @default 'default'
   */
  variant?: QualityScoreVariant;

  /**
   * Whether to show the tier label
   * @default true
   */
  showTier?: boolean;

  /**
   * Whether to show the numeric score
   * @default true
   */
  showScore?: boolean;

  /**
   * Custom tier label
   */
  tierLabel?: string;

  /**
   * Breakdown of score components (for detailed variant)
   */
  breakdown?: QualityScoreBreakdown;
}

/**
 * Quality score breakdown
 */
export interface QualityScoreBreakdown {
  /**
   * Documentation score (0-1)
   */
  documentation?: number;

  /**
   * Maintenance score (0-1)
   */
  maintenance?: number;

  /**
   * Popularity score (0-1)
   */
  popularity?: number;

  /**
   * Security score (0-1)
   */
  security?: number;

  /**
   * Test coverage score (0-1)
   */
  tests?: number;
}

/**
 * QualityScore ref type
 */
export type QualityScoreRef = HTMLDivElement;
