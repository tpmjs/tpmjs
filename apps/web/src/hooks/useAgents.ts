import useSWR from 'swr';

export interface PublicAgent {
  id: string;
  uid: string;
  name: string;
  description: string | null;
  provider: string;
  modelId: string;
  likeCount: number;
  toolCount: number;
  collectionCount: number;
  createdAt: string;
  createdBy: {
    id: string;
    name: string;
    image: string | null;
    username: string | null;
  };
}

export interface UseAgentsParams {
  sort?: 'likes' | 'recent' | 'tools';
  limit?: number;
  offset?: number;
}

interface AgentsResponse {
  agents: PublicAgent[];
  pagination: {
    hasMore: boolean;
  };
}

/**
 * Fetch public agents
 */
export function useAgents(params: UseAgentsParams = {}) {
  const searchParams = new URLSearchParams();

  searchParams.set('limit', String(params.limit ?? 100));
  searchParams.set('offset', String(params.offset ?? 0));
  if (params.sort) {
    searchParams.set('sort', params.sort);
  }

  const queryString = searchParams.toString();

  // Custom response handler since the API returns { success, data, pagination }
  return useSWR<AgentsResponse>(
    `/api/public/agents?${queryString}`,
    async (url: string) => {
      const res = await fetch(url);
      const json = await res.json();

      if (!json.success) {
        throw new Error(json.error?.message || 'Failed to fetch agents');
      }

      return {
        agents: json.data,
        pagination: json.pagination,
      };
    }
  );
}
