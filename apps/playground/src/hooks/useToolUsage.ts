'use client';

import { useCallback, useState } from 'react';
import type { ToolUsageStats } from '~/lib/types';

export function useToolUsage() {
  const [toolUsage, setToolUsage] = useState<Map<string, ToolUsageStats>>(new Map());

  const trackTool = useCallback((packageName: string) => {
    setToolUsage((prev) => {
      const newMap = new Map(prev);
      const existing = newMap.get(packageName);

      if (existing) {
        newMap.set(packageName, {
          ...existing,
          callCount: existing.callCount + 1,
          lastCalledAt: new Date(),
        });
      } else {
        newMap.set(packageName, {
          packageName,
          callCount: 1,
          lastCalledAt: new Date(),
        });
      }

      return newMap;
    });
  }, []);

  const clearUsage = useCallback(() => {
    setToolUsage(new Map());
  }, []);

  // Convert Map to array sorted by most recent first
  const toolUsageArray = Array.from(toolUsage.values()).sort(
    (a, b) => b.lastCalledAt.getTime() - a.lastCalledAt.getTime()
  );

  return {
    toolUsage: toolUsageArray,
    trackTool,
    clearUsage,
  };
}
