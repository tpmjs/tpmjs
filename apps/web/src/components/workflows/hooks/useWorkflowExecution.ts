'use client';

import { useCallback, useRef, useState } from 'react';

interface NodeStatus {
  status: 'idle' | 'running' | 'completed' | 'failed' | 'skipped';
  output?: unknown;
  error?: string;
}

interface ExecutionResult {
  executionId: string;
  success: boolean;
  output?: unknown;
  error?: string;
}

export function useWorkflowExecution(workflowId: string) {
  const [isRunning, setIsRunning] = useState(false);
  const [nodeStatuses, setNodeStatuses] = useState<Map<string, NodeStatus>>(new Map());
  const [lastExecution, setLastExecution] = useState<ExecutionResult | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const handleEvent = useCallback((event: string, data: Record<string, unknown>) => {
    switch (event) {
      case 'node_start':
        setNodeStatuses((prev) => {
          const next = new Map(prev);
          next.set(data.nodeId as string, { status: 'running' });
          return next;
        });
        break;

      case 'node_complete':
        setNodeStatuses((prev) => {
          const next = new Map(prev);
          next.set(data.nodeId as string, {
            status: 'completed',
            output: data.output,
          });
          return next;
        });
        break;

      case 'node_error':
        setNodeStatuses((prev) => {
          const next = new Map(prev);
          next.set(data.nodeId as string, {
            status: 'failed',
            error: data.error as string,
          });
          return next;
        });
        break;

      case 'node_skipped':
        setNodeStatuses((prev) => {
          const next = new Map(prev);
          next.set(data.nodeId as string, { status: 'skipped' });
          return next;
        });
        break;

      case 'workflow_complete':
        setLastExecution({
          executionId: data.executionId as string,
          success: data.success as boolean,
          output: data.output,
          error: data.error as string | undefined,
        });
        break;

      case 'workflow_error':
        setLastExecution({
          executionId: data.executionId as string,
          success: false,
          error: data.error as string,
        });
        break;
    }
  }, []);

  const runWorkflow = useCallback(
    (triggerInput: Record<string, unknown>) => {
      if (isRunning) return;

      setIsRunning(true);
      setNodeStatuses(new Map());
      setLastExecution(null);

      fetch(`/api/workflows/${workflowId}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ triggerInput }),
      })
        .then(async (response) => {
          if (!response.ok || !response.body) {
            setIsRunning(false);
            setLastExecution({
              executionId: '',
              success: false,
              error: `HTTP ${response.status}`,
            });
            return;
          }

          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            let currentEvent = '';
            for (const line of lines) {
              if (line.startsWith('event: ')) {
                currentEvent = line.slice(7);
              } else if (line.startsWith('data: ') && currentEvent) {
                try {
                  const parsed = JSON.parse(line.slice(6));
                  handleEvent(currentEvent, parsed);
                } catch {
                  // Ignore parse errors
                }
                currentEvent = '';
              }
            }
          }

          setIsRunning(false);
        })
        .catch((err) => {
          console.error('Workflow execution failed:', err);
          setIsRunning(false);
          setLastExecution({
            executionId: '',
            success: false,
            error: err instanceof Error ? err.message : 'Unknown error',
          });
        });
    },
    [workflowId, isRunning, handleEvent]
  );

  const cancel = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsRunning(false);
  }, []);

  return {
    isRunning,
    nodeStatuses,
    lastExecution,
    runWorkflow,
    cancel,
  };
}
