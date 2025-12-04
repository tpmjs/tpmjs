'use client';

import type React from 'react';
import { Badge } from '../Badge/Badge';
import { Icon } from '../Icon/Icon';

export interface ToolHealthBadgeProps {
  importHealth?: 'HEALTHY' | 'BROKEN' | 'UNKNOWN';
  executionHealth?: 'HEALTHY' | 'BROKEN' | 'UNKNOWN';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Badge component to indicate if a tool is broken (import or execution failed)
 */
export function ToolHealthBadge({
  importHealth,
  executionHealth,
  size = 'sm',
  className,
}: ToolHealthBadgeProps): React.ReactElement | null {
  const isBroken = importHealth === 'BROKEN' || executionHealth === 'BROKEN';

  if (!isBroken) {
    return null;
  }

  return (
    <Badge variant="error" size={size} className={className}>
      <Icon icon="x" size="sm" className="mr-1" />
      Broken
    </Badge>
  );
}
