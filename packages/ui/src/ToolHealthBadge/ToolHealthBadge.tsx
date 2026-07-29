'use client';

import type React from 'react';
import { Badge } from '../Badge/Badge';
import { Icon } from '../Icon/Icon';

export interface ToolHealthBadgeProps {
  importHealth?: 'HEALTHY' | 'BROKEN' | 'UNKNOWN' | null;
  executionHealth?: 'HEALTHY' | 'BROKEN' | 'UNKNOWN' | null;
  /** Honest, data-derived explanation shown as a tooltip (e.g. "Failing to import for N consecutive checks — last checked <date>."). */
  summary?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Badge that flags a broken tool (import or execution health failed). Renders
 * nothing for healthy tools. When a `summary` is provided it becomes the badge
 * tooltip so the honest, data-derived reason is one hover away.
 */
export function ToolHealthBadge({
  importHealth,
  executionHealth,
  summary,
  size = 'sm',
  className,
}: ToolHealthBadgeProps): React.ReactElement | null {
  const isBroken = importHealth === 'BROKEN' || executionHealth === 'BROKEN';

  if (!isBroken) {
    return null;
  }

  return (
    <Badge variant="error" size={size} className={className} title={summary ?? undefined}>
      <Icon icon="x" size="sm" className="mr-1" />
      Broken
    </Badge>
  );
}
