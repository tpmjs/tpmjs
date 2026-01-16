import useSWR, { type KeyedMutator } from 'swr';
import type { LikeEntityType } from '~/components/LikeButton';

export interface LikeStatusData {
  liked: boolean;
  likeCount: number;
}

interface UseLikeStatusReturn {
  data: LikeStatusData | undefined;
  isLoading: boolean;
  error: Error | undefined;
  mutate: KeyedMutator<LikeStatusData>;
  toggleLike: () => Promise<void>;
}

/**
 * Hook for managing like status with optimistic updates
 * @param entityType - 'tool' | 'collection' | 'agent'
 * @param entityId - The ID of the entity
 * @param enabled - Whether to enable fetching (typically based on session)
 * @param initialData - Optional initial data to use before fetch completes
 */
export function useLikeStatus(
  entityType: LikeEntityType,
  entityId: string,
  enabled: boolean,
  initialData?: LikeStatusData
): UseLikeStatusReturn {
  const key = enabled ? `/api/${entityType}s/${entityId}/like` : null;

  const { data, error, isLoading, mutate } = useSWR<LikeStatusData>(key, {
    fallbackData: initialData,
    revalidateOnFocus: false,
  });

  const toggleLike = async () => {
    if (!data) return;

    const newLiked = !data.liked;
    const newCount = newLiked ? data.likeCount + 1 : Math.max(0, data.likeCount - 1);

    // Optimistic update
    await mutate(
      { liked: newLiked, likeCount: newCount },
      { revalidate: false }
    );

    try {
      const response = await fetch(`/api/${entityType}s/${entityId}/like`, {
        method: newLiked ? 'POST' : 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        // Update with server values
        await mutate(result.data, { revalidate: false });
      } else {
        // Revert on error
        await mutate(data, { revalidate: false });
      }
    } catch {
      // Revert on error
      await mutate(data, { revalidate: false });
    }
  };

  return {
    data,
    isLoading,
    error,
    mutate,
    toggleLike,
  };
}
