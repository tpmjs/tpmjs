import useSWR from 'swr';

export interface PlatformStats {
  packages: number;
  tools: number;
  agents: number;
  collections: number;
  executions: number;
  users: number;
  categories: { category: string; _count: { _all: number } }[];
  healthyTools: number;
  brokenTools: number;
}

export interface ExecutionStats {
  total: number;
  successRate: number;
  avgDurationMs: number;
  dailyExecutions: { date: string; count: number }[];
}

export interface HistorySnapshot {
  date: string;
  data: {
    packages?: number;
    tools?: number;
    agents?: number;
    collections?: number;
    users?: number;
    executions?: number;
  };
}

/**
 * Fetch platform statistics
 * Returns multiple SWR hooks for parallel fetching
 */
export function useStats() {
  const stats = useSWR<PlatformStats>('/api/stats');
  const executions = useSWR<ExecutionStats>('/api/stats/executions');
  const history = useSWR<HistorySnapshot[]>('/api/sync/stats-snapshot?days=90');

  return {
    stats: {
      data: stats.data,
      isLoading: stats.isLoading,
      error: stats.error,
    },
    executions: {
      data: executions.data,
      isLoading: executions.isLoading,
      error: executions.error,
    },
    history: {
      data: history.data,
      isLoading: history.isLoading,
      error: history.error,
    },
    isLoading: stats.isLoading || executions.isLoading || history.isLoading,
  };
}
