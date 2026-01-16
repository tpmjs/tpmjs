import useSWRInfinite from 'swr/infinite';

export interface Activity {
  id: string;
  type: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  tool?: {
    name: string;
    package: { npmPackageName: string };
  };
  agent?: {
    name: string;
    uid: string;
  };
  collection?: {
    name: string;
    uid: string;
  };
}

interface ActivityResponse {
  activities: Activity[];
  pagination: {
    nextCursor: string | null;
  };
}

/**
 * Infinite scroll hook for user activity stream
 */
export function useActivity(limit = 20) {
  const getKey = (pageIndex: number, previousPageData: ActivityResponse | null) => {
    // Reached the end
    if (previousPageData && !previousPageData.pagination.nextCursor) {
      return null;
    }

    // First page
    if (pageIndex === 0) {
      return `/api/user/activity?limit=${limit}`;
    }

    // Next pages
    const cursor = previousPageData?.pagination.nextCursor;
    return `/api/user/activity?limit=${limit}&cursor=${cursor}`;
  };

  const { data, error, isLoading, isValidating, size, setSize, mutate } =
    useSWRInfinite<ActivityResponse>(
      getKey,
      async (url: string) => {
        const res = await fetch(url);
        const json = await res.json();

        if (!json.success) {
          throw new Error(json.error || 'Failed to fetch activity');
        }

        return {
          activities: json.data,
          pagination: json.pagination,
        };
      },
      {
        revalidateFirstPage: false,
      }
    );

  // Flatten all activities from all pages
  const activities = data ? data.flatMap((page: ActivityResponse) => page.activities) : [];

  // Check if there are more pages
  const hasMore = data ? data[data.length - 1]?.pagination.nextCursor !== null : false;

  const loadMore = () => {
    if (hasMore && !isValidating) {
      setSize(size + 1);
    }
  };

  return {
    activities,
    isLoading,
    isLoadingMore: isValidating && data && data.length > 0,
    error,
    hasMore,
    loadMore,
    mutate,
  };
}
