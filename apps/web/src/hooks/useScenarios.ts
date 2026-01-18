import useSWR from 'swr';

export interface PublicScenario {
  id: string;
  collectionId: string | null;
  prompt: string;
  name: string | null;
  description: string | null;
  tags: string[];
  qualityScore: number;
  totalRuns: number;
  lastRunAt: string | null;
  lastRunStatus: string | null;
  createdAt: string;
  collection: {
    id: string;
    name: string;
    slug: string;
    username: string;
  } | null;
  runCount: number;
}

export interface UseScenariosParams {
  sortBy?: 'qualityScore' | 'totalRuns' | 'createdAt' | 'lastRunAt';
  limit?: number;
  offset?: number;
  tags?: string[];
}

interface ScenariosResponse {
  scenarios: PublicScenario[];
  pagination: {
    hasMore: boolean;
    limit: number;
    offset: number;
  };
}

/**
 * Fetch public scenarios
 */
export function useScenarios(params: UseScenariosParams = {}) {
  const searchParams = new URLSearchParams();

  searchParams.set('limit', String(params.limit ?? 100));
  searchParams.set('offset', String(params.offset ?? 0));
  if (params.sortBy) {
    searchParams.set('sortBy', params.sortBy);
  }
  if (params.tags && params.tags.length > 0) {
    searchParams.set('tags', params.tags.join(','));
  }

  const queryString = searchParams.toString();

  return useSWR<ScenariosResponse>(`/api/scenarios?${queryString}`, async (url: string) => {
    const res = await fetch(url);
    const json = await res.json();

    if (!json.success) {
      throw new Error(json.error?.message || 'Failed to fetch scenarios');
    }

    return {
      scenarios: json.data,
      pagination: json.pagination,
    };
  });
}

/**
 * Fetch featured scenarios for homepage
 */
export function useFeaturedScenarios(limit = 6) {
  return useSWR<PublicScenario[]>(`/api/scenarios/featured?limit=${limit}`, async (url: string) => {
    const res = await fetch(url);
    const json = await res.json();

    if (!json.success) {
      throw new Error(json.error?.message || 'Failed to fetch featured scenarios');
    }

    return json.data;
  });
}
