import useSWR from 'swr';
import type { DiscoveryTool } from '~/lib/discovery/types';

export type Tool = DiscoveryTool;

export interface UseToolsParams {
  category?: string;
  importHealth?: string;
  executionHealth?: string;
  broken?: boolean;
  limit?: number;
}

interface UseToolsOptions {
  fallbackData?: Tool[];
}

export function useTools(params: UseToolsParams = {}, options: UseToolsOptions = {}) {
  const searchParams = new URLSearchParams();

  if (params.category && params.category !== 'all') {
    searchParams.set('category', params.category);
  }
  if (params.importHealth) {
    searchParams.set('importHealth', params.importHealth);
  }
  if (params.executionHealth) {
    searchParams.set('executionHealth', params.executionHealth);
  }
  if (params.broken) {
    searchParams.set('broken', 'true');
  }
  searchParams.set('limit', String(params.limit ?? 1000));

  const queryString = searchParams.toString();

  return useSWR<Tool[]>(`/api/tools?${queryString}`, {
    fallbackData: options.fallbackData,
  });
}
