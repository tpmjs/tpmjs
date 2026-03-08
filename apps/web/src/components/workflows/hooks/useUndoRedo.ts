'use client';

import type { Edge, Node } from '@xyflow/react';
import { useCallback, useRef, useState } from 'react';

interface GraphState {
  nodes: Node[];
  edges: Edge[];
}

const MAX_HISTORY = 50;

export function useUndoRedo() {
  const pastRef = useRef<GraphState[]>([]);
  const futureRef = useRef<GraphState[]>([]);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const pushState = useCallback((nodes: Node[], edges: Edge[]) => {
    pastRef.current = [
      ...pastRef.current.slice(-MAX_HISTORY + 1),
      { nodes: structuredClone(nodes), edges: structuredClone(edges) },
    ];
    futureRef.current = [];
    setCanUndo(true);
    setCanRedo(false);
  }, []);

  const undo = useCallback((): GraphState | null => {
    if (pastRef.current.length === 0) return null;
    const state = pastRef.current.pop() as GraphState;
    futureRef.current.push(state);
    setCanUndo(pastRef.current.length > 0);
    setCanRedo(true);
    const lastPast = pastRef.current[pastRef.current.length - 1];
    return lastPast ?? state;
  }, []);

  const redo = useCallback((): GraphState | null => {
    if (futureRef.current.length === 0) return null;
    const state = futureRef.current.pop() as GraphState;
    pastRef.current.push(state);
    setCanUndo(true);
    setCanRedo(futureRef.current.length > 0);
    return state;
  }, []);

  return { pushState, undo, redo, canUndo, canRedo };
}
