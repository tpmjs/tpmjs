'use client';

import { Icon } from '@tpmjs/ui/Icon/Icon';
import { useCallback, useEffect, useState } from 'react';
import { useSession } from '@/lib/auth-client';

interface RatingProps {
  toolId: string;
  initialRating?: number | null;
  initialAverageRating?: number | null;
  initialRatingCount?: number;
  size?: 'sm' | 'md' | 'lg';
  showAverage?: boolean;
  showCount?: boolean;
  interactive?: boolean;
  onRatingChange?: (
    rating: number | null,
    averageRating: number | null,
    ratingCount: number
  ) => void;
}

export function Rating({
  toolId,
  initialRating = null,
  initialAverageRating = null,
  initialRatingCount = 0,
  size = 'md',
  showAverage = true,
  showCount = true,
  interactive = true,
  onRatingChange,
}: RatingProps): React.ReactElement {
  const { data: session } = useSession();
  const [userRating, setUserRating] = useState<number | null>(initialRating);
  const [averageRating, setAverageRating] = useState<number | null>(initialAverageRating);
  const [ratingCount, setRatingCount] = useState(initialRatingCount);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  // Fetch initial rating status when user is logged in
  useEffect(() => {
    if (hasFetched) return;

    const fetchRatingStatus = async () => {
      try {
        const response = await fetch(`/api/tools/${toolId}/rate`);
        const data = await response.json();
        if (data.success) {
          setUserRating(data.data.userRating);
          setAverageRating(data.data.averageRating);
          setRatingCount(data.data.ratingCount);
        }
      } catch (error) {
        console.error('Failed to fetch rating status:', error);
      } finally {
        setHasFetched(true);
      }
    };

    fetchRatingStatus();
  }, [toolId, hasFetched]);

  // Update from props when they change
  useEffect(() => {
    if (!hasFetched) {
      setUserRating(initialRating);
      setAverageRating(initialAverageRating);
      setRatingCount(initialRatingCount);
    }
  }, [initialRating, initialAverageRating, initialRatingCount, hasFetched]);

  const submitRating = useCallback(
    async (newRating: number | null, previousRating: number | null) => {
      const response = await fetch(`/api/tools/${toolId}/rate`, {
        method: newRating ? 'POST' : 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: newRating ? JSON.stringify({ rating: newRating }) : undefined,
      });

      const data = await response.json();

      if (data.success) {
        setUserRating(data.data.userRating);
        setAverageRating(data.data.averageRating);
        setRatingCount(data.data.ratingCount);
        onRatingChange?.(data.data.userRating, data.data.averageRating, data.data.ratingCount);
      } else {
        setUserRating(previousRating);
      }
    },
    [toolId, onRatingChange]
  );

  const handleRate = useCallback(
    async (rating: number) => {
      if (!session) {
        setShowTooltip(true);
        setTimeout(() => setShowTooltip(false), 2000);
        return;
      }

      if (isLoading || !interactive) return;

      const newRating = userRating === rating ? null : rating;
      const previousRating = userRating;

      setUserRating(newRating);
      setIsLoading(true);

      try {
        await submitRating(newRating, previousRating);
      } catch (error) {
        console.error('Failed to rate:', error);
        setUserRating(previousRating);
      } finally {
        setIsLoading(false);
      }
    },
    [session, userRating, isLoading, interactive, submitRating]
  );

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const starSize = sizeClasses[size];

  // Determine which rating to display (hover > user > average)
  const displayRating = hoverRating ?? userRating ?? averageRating ?? 0;

  return (
    <div className="relative inline-flex flex-col gap-1">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = star <= displayRating;
          const isHalfFilled = !isFilled && star - 0.5 <= displayRating;

          return (
            <button
              key={star}
              type="button"
              disabled={isLoading || !interactive}
              onClick={() => handleRate(star)}
              onMouseEnter={() => interactive && setHoverRating(star)}
              onMouseLeave={() => interactive && setHoverRating(null)}
              className={`
                ${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'}
                transition-transform duration-100
                ${isLoading ? 'opacity-50' : ''}
                focus:outline-none focus:ring-2 focus:ring-primary/50 rounded
              `}
              aria-label={`Rate ${star} stars`}
            >
              <div className={`${starSize} relative`}>
                {isFilled ? (
                  <Icon
                    icon="starFilled"
                    className={`${starSize} ${
                      userRating && star <= userRating ? 'text-yellow-400' : 'text-yellow-400/70'
                    }`}
                  />
                ) : isHalfFilled ? (
                  <div className="relative">
                    <Icon icon="star" className={`${starSize} text-foreground-tertiary`} />
                    <div className="absolute inset-0 overflow-hidden w-1/2">
                      <Icon icon="starFilled" className={`${starSize} text-yellow-400/70`} />
                    </div>
                  </div>
                ) : (
                  <Icon icon="star" className={`${starSize} text-foreground-tertiary`} />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {(showAverage || showCount) && (
        <div className="flex items-center gap-2 text-sm text-foreground-secondary">
          {showAverage && averageRating !== null && (
            <span className="font-medium">{averageRating.toFixed(1)}</span>
          )}
          {showCount && ratingCount > 0 && (
            <span className="text-foreground-tertiary">
              ({ratingCount} {ratingCount === 1 ? 'rating' : 'ratings'})
            </span>
          )}
        </div>
      )}

      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-surface-secondary border border-border rounded-lg shadow-lg text-xs text-foreground whitespace-nowrap z-50 animate-in fade-in slide-in-from-bottom-1 duration-200">
          <a href="/sign-in" className="text-primary hover:underline">
            Sign in
          </a>{' '}
          to rate
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
            <div className="border-4 border-transparent border-t-border" />
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Display-only rating (non-interactive)
 */
interface RatingDisplayProps {
  averageRating: number | null;
  ratingCount?: number;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
  className?: string;
}

export function RatingDisplay({
  averageRating,
  ratingCount = 0,
  size = 'sm',
  showCount = true,
  className = '',
}: RatingDisplayProps): React.ReactElement {
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const starSize = sizeClasses[size];
  const rating = averageRating ?? 0;

  return (
    <div className={`inline-flex items-center gap-1 ${className}`}>
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = star <= rating;
          const isHalfFilled = !isFilled && star - 0.5 <= rating;

          return (
            <div key={star} className={`${starSize} relative`}>
              {isFilled ? (
                <Icon icon="starFilled" className={`${starSize} text-yellow-400`} />
              ) : isHalfFilled ? (
                <div className="relative">
                  <Icon icon="star" className={`${starSize} text-foreground-tertiary`} />
                  <div className="absolute inset-0 overflow-hidden w-1/2">
                    <Icon icon="starFilled" className={`${starSize} text-yellow-400`} />
                  </div>
                </div>
              ) : (
                <Icon icon="star" className={`${starSize} text-foreground-tertiary`} />
              )}
            </div>
          );
        })}
      </div>

      {averageRating !== null && (
        <span className="text-sm text-foreground-secondary font-medium ml-1">
          {averageRating.toFixed(1)}
        </span>
      )}

      {showCount && ratingCount > 0 && (
        <span className="text-sm text-foreground-tertiary">({ratingCount})</span>
      )}
    </div>
  );
}
