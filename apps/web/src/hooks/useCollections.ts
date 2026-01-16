import useSWR from 'swr';

export interface PublicCollection {
  id: string;
  uid: string;
  name: string;
  description: string | null;
  likeCount: number;
  forkCount: number;
  toolCount: number;
  createdAt: string;
  createdBy: {
    id: string;
    name: string;
    image: string | null;
    username: string | null;
  };
}

export interface UseCollectionsParams {
  sort?: 'likes' | 'recent' | 'tools';
  limit?: number;
  offset?: number;
}

interface CollectionsResponse {
  collections: PublicCollection[];
  pagination: {
    hasMore: boolean;
  };
}

/**
 * Fetch public collections
 */
export function useCollections(params: UseCollectionsParams = {}) {
  const searchParams = new URLSearchParams();

  searchParams.set('limit', String(params.limit ?? 100));
  searchParams.set('offset', String(params.offset ?? 0));
  if (params.sort) {
    searchParams.set('sort', params.sort);
  }

  const queryString = searchParams.toString();

  // Custom response handler since the API returns { success, data, pagination }
  return useSWR<CollectionsResponse>(
    `/api/public/collections?${queryString}`,
    async (url: string) => {
      const res = await fetch(url);
      const json = await res.json();

      if (!json.success) {
        throw new Error(json.error?.message || 'Failed to fetch collections');
      }

      return {
        collections: json.data,
        pagination: json.pagination,
      };
    }
  );
}
