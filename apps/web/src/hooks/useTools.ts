import useSWR from 'swr';

export interface Tool {
  id: string;
  name: string;
  description: string;
  qualityScore: string;
  likeCount?: number;
  importHealth?: 'HEALTHY' | 'BROKEN' | 'UNKNOWN';
  executionHealth?: 'HEALTHY' | 'BROKEN' | 'UNKNOWN';
  createdAt: string;
  package: {
    npmPackageName: string;
    npmVersion: string;
    npmPublishedAt: string;
    category: string;
    npmRepository: { url: string; type: string } | null;
    isOfficial: boolean;
    npmDownloadsLastMonth: number;
  };
}

export interface UseToolsParams {
  category?: string;
  importHealth?: string;
  executionHealth?: string;
  broken?: boolean;
  limit?: number;
}

export function useTools(params: UseToolsParams = {}) {
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

  return useSWR<Tool[]>(`/api/tools?${queryString}`);
}
