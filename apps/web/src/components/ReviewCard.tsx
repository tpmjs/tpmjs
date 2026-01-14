'use client';

import { Card, CardContent } from '@tpmjs/ui/Card/Card';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import Image from 'next/image';
import Link from 'next/link';
import { RatingDisplay } from './Rating';

interface ReviewUser {
  id: string;
  name: string;
  image: string | null;
  username: string | null;
}

export interface Review {
  id: string;
  title: string | null;
  content: string;
  rating: number;
  helpfulCount: number;
  createdAt: string;
  updatedAt: string;
  user: ReviewUser;
}

interface ReviewCardProps {
  review: Review;
  className?: string;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
  } else if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `${months} ${months === 1 ? 'month' : 'months'} ago`;
  } else {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function UserAvatar({ user }: { user: ReviewUser }): React.ReactElement {
  const initials = getInitials(user.name);

  if (user.image) {
    return (
      <Image
        src={user.image}
        alt={user.name}
        width={40}
        height={40}
        className="h-10 w-10 rounded-full object-cover"
      />
    );
  }

  return (
    <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-medium text-sm">
      {initials}
    </div>
  );
}

export function ReviewCard({ review, className = '' }: ReviewCardProps): React.ReactElement {
  const userLink = review.user.username ? `/@${review.user.username}` : null;

  return (
    <Card className={className}>
      <CardContent className="pt-4">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          {/* Avatar */}
          {userLink ? (
            <Link href={userLink} className="flex-shrink-0">
              <UserAvatar user={review.user} />
            </Link>
          ) : (
            <div className="flex-shrink-0">
              <UserAvatar user={review.user} />
            </div>
          )}

          {/* User info and rating */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {userLink ? (
                <Link
                  href={userLink}
                  className="font-medium text-foreground hover:text-primary truncate"
                >
                  {review.user.name}
                </Link>
              ) : (
                <span className="font-medium text-foreground truncate">{review.user.name}</span>
              )}
              <span className="text-foreground-tertiary text-sm">
                {formatDate(review.createdAt)}
              </span>
            </div>
            <RatingDisplay
              averageRating={review.rating}
              showCount={false}
              size="sm"
              className="mt-0.5"
            />
          </div>
        </div>

        {/* Title */}
        {review.title && <h4 className="font-semibold text-foreground mb-2">{review.title}</h4>}

        {/* Content */}
        <p className="text-foreground-secondary text-sm whitespace-pre-wrap">{review.content}</p>

        {/* Helpful count */}
        {review.helpfulCount > 0 && (
          <div className="mt-3 flex items-center gap-1 text-sm text-foreground-tertiary">
            <Icon icon="heart" size="xs" />
            <span>
              {review.helpfulCount} {review.helpfulCount === 1 ? 'person' : 'people'} found this
              helpful
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Reviews section with list of reviews and write review form
 */
interface ReviewsSectionProps {
  initialReviews?: Review[];
  className?: string;
}

export function ReviewsSection({
  initialReviews = [],
  className = '',
}: ReviewsSectionProps): React.ReactElement {
  // For now, just display the reviews statically
  // Interactive features (write review, load more) can be added later

  if (initialReviews.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <Icon icon="message" size="lg" className="text-foreground-tertiary mx-auto mb-2" />
        <p className="text-foreground-secondary">No reviews yet</p>
        <p className="text-sm text-foreground-tertiary mt-1">
          Be the first to share your experience with this tool
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {initialReviews.map((review) => (
        <ReviewCard key={review.id} review={review} />
      ))}
    </div>
  );
}
