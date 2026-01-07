'use client';

import { useSession } from '@/lib/auth-client';
import { Button } from '@tpmjs/ui/Button/Button';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import { useCallback, useEffect, useState } from 'react';

export type LikeEntityType = 'tool' | 'collection' | 'agent';

interface LikeButtonProps {
  entityType: LikeEntityType;
  entityId: string;
  initialLiked?: boolean;
  initialCount?: number;
  showCount?: boolean;
  size?: 'sm' | 'md';
  variant?: 'ghost' | 'outline';
  className?: string;
  onLikeChange?: (liked: boolean, count: number) => void;
}

export function LikeButton({
  entityType,
  entityId,
  initialLiked = false,
  initialCount = 0,
  showCount = true,
  size = 'sm',
  variant = 'ghost',
  className,
  onLikeChange,
}: LikeButtonProps): React.ReactElement {
  const { data: session } = useSession();
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [isLoading, setIsLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);

  // Fetch initial like status when user is logged in
  useEffect(() => {
    if (!session || hasFetched) return;

    const fetchLikeStatus = async () => {
      try {
        const response = await fetch(`/api/${entityType}s/${entityId}/like`);
        const data = await response.json();
        if (data.success) {
          setLiked(data.data.liked);
          setCount(data.data.likeCount);
        }
      } catch (error) {
        console.error('Failed to fetch like status:', error);
      } finally {
        setHasFetched(true);
      }
    };

    fetchLikeStatus();
  }, [session, entityType, entityId, hasFetched]);

  // Update from props when they change
  useEffect(() => {
    if (!hasFetched) {
      setLiked(initialLiked);
      setCount(initialCount);
    }
  }, [initialLiked, initialCount, hasFetched]);

  const handleClick = useCallback(async () => {
    if (!session) {
      // Redirect to sign in
      window.location.href = '/sign-in';
      return;
    }

    if (isLoading) return;

    // Optimistic update
    const newLiked = !liked;
    const newCount = newLiked ? count + 1 : Math.max(0, count - 1);
    setLiked(newLiked);
    setCount(newCount);

    setIsLoading(true);

    try {
      const response = await fetch(`/api/${entityType}s/${entityId}/like`, {
        method: newLiked ? 'POST' : 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        // Update with server values
        setLiked(data.data.liked);
        setCount(data.data.likeCount);
        onLikeChange?.(data.data.liked, data.data.likeCount);
      } else {
        // Revert on error
        setLiked(!newLiked);
        setCount(liked ? count : Math.max(0, count - 1));
      }
    } catch (error) {
      console.error('Failed to toggle like:', error);
      // Revert on error
      setLiked(!newLiked);
      setCount(liked ? count : Math.max(0, count - 1));
    } finally {
      setIsLoading(false);
    }
  }, [session, liked, count, isLoading, entityType, entityId, onLikeChange]);

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      disabled={isLoading}
      className={className}
      aria-label={liked ? `Unlike this ${entityType}` : `Like this ${entityType}`}
    >
      <Icon
        icon={liked ? 'heartFilled' : 'heart'}
        size="sm"
        className={liked ? 'text-red-500' : ''}
      />
      {showCount && <span className="ml-1">{count}</span>}
    </Button>
  );
}

/**
 * Display-only like count (no interaction)
 */
interface LikeCountProps {
  count: number;
  className?: string;
}

export function LikeCount({ count, className }: LikeCountProps): React.ReactElement {
  return (
    <span className={`inline-flex items-center gap-1 text-foreground-secondary ${className || ''}`}>
      <Icon icon="heart" size="xs" />
      <span className="text-sm">{count}</span>
    </span>
  );
}
