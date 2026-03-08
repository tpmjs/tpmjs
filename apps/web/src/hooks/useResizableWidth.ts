'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const MIN_WIDTH = 200;
const MAX_WIDTH = 600;

/**
 * Hook for making a panel horizontally resizable with localStorage persistence.
 * The drag handle is placed on the left edge of the panel (dragging left = wider).
 */
export function useResizableWidth(storageKey: string, defaultWidth: number) {
  const [width, setWidth] = useState(defaultWidth);
  const dragState = useRef<{ startX: number; startWidth: number } | null>(null);

  // Load persisted width on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = Number.parseInt(stored, 10);
        if (parsed >= MIN_WIDTH && parsed <= MAX_WIDTH) {
          setWidth(parsed); // eslint-disable-line react-hooks/set-state-in-effect
        }
      }
    } catch {
      // ignore
    }
  }, [storageKey]);

  // Persist width on change (debounced by drag end, but we save on every set for simplicity)
  const persist = useCallback(
    (w: number) => {
      try {
        localStorage.setItem(storageKey, String(w));
      } catch {
        // ignore
      }
    },
    [storageKey]
  );

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      dragState.current = { startX: e.clientX, startWidth: width };
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    },
    [width]
  );

  // Attach global listeners while dragging
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!dragState.current) return;
      const delta = dragState.current.startX - e.clientX;
      const newWidth = Math.min(
        MAX_WIDTH,
        Math.max(MIN_WIDTH, dragState.current.startWidth + delta)
      );
      setWidth(newWidth);
    };

    const onMouseUp = (e: MouseEvent) => {
      if (!dragState.current) return;
      const delta = dragState.current.startX - e.clientX;
      const finalWidth = Math.min(
        MAX_WIDTH,
        Math.max(MIN_WIDTH, dragState.current.startWidth + delta)
      );
      persist(finalWidth);
      dragState.current = null;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, [persist]);

  const handleProps = {
    onMouseDown,
    className:
      'absolute left-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-primary/20 active:bg-primary/30 transition-colors z-10',
  } as const;

  return { width, handleProps };
}
