import type { HTMLAttributes, ReactNode } from 'react';

/**
 * Tool tier types
 */
export type ToolTier = 'minimal' | 'rich';

/**
 * ToolCard variant types
 */
export type ToolCardVariant = 'default' | 'compact' | 'featured';

/**
 * ToolCard component props
 */
export interface ToolCardProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Package name
   */
  name: string;

  /**
   * Package display name (optional, defaults to name)
   */
  displayName?: string;

  /**
   * Package version
   */
  version?: string;

  /**
   * Short description
   */
  description?: string;

  /**
   * Package author/maintainer
   */
  author?: string;

  /**
   * Tool tier (minimal or rich)
   */
  tier?: ToolTier;

  /**
   * Quality score (0-100)
   */
  qualityScore?: number;

  /**
   * Monthly downloads count
   */
  downloads?: number;

  /**
   * GitHub stars count
   */
  stars?: number;

  /**
   * Category/tags
   */
  category?: string;

  /**
   * Whether the tool is official/verified
   */
  isOfficial?: boolean;

  /**
   * Last updated date
   */
  updatedAt?: Date | string;

  /**
   * Visual variant
   * @default 'default'
   */
  variant?: ToolCardVariant;

  /**
   * Link href for the card
   */
  href?: string;

  /**
   * Custom action slot (e.g., install button)
   */
  action?: ReactNode;

  /**
   * Icon/logo for the tool
   */
  icon?: ReactNode;

  /**
   * Import health from the registry health protocol. When BROKEN the card is
   * muted and flagged so the tool is never visually indistinguishable from a
   * healthy one.
   */
  importHealth?: 'HEALTHY' | 'BROKEN' | 'UNKNOWN' | null;

  /**
   * Execution health from the registry health protocol.
   */
  executionHealth?: 'HEALTHY' | 'BROKEN' | 'UNKNOWN' | null;

  /**
   * Honest, data-derived health explanation used as the broken-badge tooltip
   * (e.g. "Failing to import for N consecutive checks — last checked <date>.").
   */
  healthSummary?: string | null;
}
