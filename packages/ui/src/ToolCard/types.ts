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
}

/**
 * ToolCard ref type
 */
export type ToolCardRef = HTMLDivElement;
