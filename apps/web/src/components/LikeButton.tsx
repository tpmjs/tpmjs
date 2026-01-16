'use client';

import { useSession } from '@/lib/auth-client';
import { Button } from '@tpmjs/ui/Button/Button';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import { useCallback, useState } from 'react';
import { useLikeStatus } from '~/hooks/useLikeStatus';

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
  const [showTooltip, setShowTooltip] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Use SWR for like status with optimistic updates
  const { data, toggleLike } = useLikeStatus(
    entityType,
    entityId,
    !!session,
    { liked: initialLiked, likeCount: initialCount }
  );

  const liked = data?.liked ?? initialLiked;
  const count = data?.likeCount ?? initialCount;

  const handleClick = useCallback(async () => {
    if (!session) {
      // Show tooltip instead of redirecting
      setShowTooltip(true);
      setTimeout(() => setShowTooltip(false), 2000);
      return;
    }

    if (isLoading) return;

    setIsLoading(true);
    try {
      await toggleLike();
      // Call the onLikeChange callback if provided
      if (onLikeChange && data) {
        onLikeChange(!data.liked, data.liked ? data.likeCount - 1 : data.likeCount + 1);
      }
    } finally {
      setIsLoading(false);
    }
  }, [session, isLoading, toggleLike, onLikeChange, data]);

  return (
    <div className="relative inline-block">
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
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-surface-secondary border border-border rounded-lg shadow-lg text-xs text-foreground whitespace-nowrap z-50 animate-in fade-in slide-in-from-bottom-1 duration-200">
          <a href="/sign-in" className="text-primary hover:underline">
            Sign in
          </a>{' '}
          to like
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
            <div className="border-4 border-transparent border-t-border" />
          </div>
        </div>
      )}
    </div>
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
