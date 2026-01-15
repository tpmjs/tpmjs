'use client';

import { cn } from '@tpmjs/utils/cn';
import { forwardRef, useMemo } from 'react';
import { Icon } from '../Icon/Icon';
import type { ToolCardProps } from './types';
import {
  toolCardActionVariants,
  toolCardDescriptionVariants,
  toolCardHeaderVariants,
  toolCardIconVariants,
  toolCardMetaItemVariants,
  toolCardMetaVariants,
  toolCardOfficialBadgeVariants,
  toolCardTierBadgeVariants,
  toolCardTitleVariants,
  toolCardVariants,
  toolCardVersionVariants,
} from './variants';

/**
 * Format download count
 */
function formatDownloads(count: number): string {
  if (count >= 1_000_000) {
    return `${(count / 1_000_000).toFixed(1)}M`;
  }
  if (count >= 1_000) {
    return `${(count / 1_000).toFixed(1)}K`;
  }
  return count.toString();
}

/**
 * Format relative time
 */
function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
  return `${Math.floor(diffDays / 365)}y ago`;
}

/**
 * ToolCard component
 *
 * A card component for displaying tool/package information.
 *
 * @example
 * ```tsx
 * import { ToolCard } from '@tpmjs/ui/ToolCard/ToolCard';
 *
 * function MyComponent() {
 *   return (
 *     <ToolCard
 *       name="@tpmjs/core"
 *       displayName="TPMJS Core"
 *       version="1.0.0"
 *       description="Core utilities for TPMJS tools"
 *       tier="rich"
 *       qualityScore={85}
 *       downloads={50000}
 *       isOfficial
 *       href="/tool/tpmjs-core"
 *     />
 *   );
 * }
 * ```
 */
export const ToolCard = forwardRef<HTMLDivElement, ToolCardProps>(
  (
    {
      name,
      displayName,
      version,
      description,
      author,
      tier,
      qualityScore,
      downloads,
      stars,
      category,
      isOfficial,
      updatedAt,
      variant = 'default',
      href,
      action,
      icon,
      className,
      ...props
    },
    ref
  ) => {
    const displayTitle = displayName || name;
    const isClickable = !!href;

    // Format downloads
    const formattedDownloads = useMemo(() => {
      if (downloads === undefined) return null;
      return formatDownloads(downloads);
    }, [downloads]);

    // Format update time
    const formattedTime = useMemo(() => {
      if (!updatedAt) return null;
      return formatRelativeTime(updatedAt);
    }, [updatedAt]);

    const cardClassName = cn(toolCardVariants({ variant, clickable: isClickable ? 'true' : 'false' }), className);

    const cardContent = (
      <>
        {/* Header */}
        <div className={toolCardHeaderVariants({ variant })}>
          {/* Icon */}
          {icon && (
            <div className={toolCardIconVariants({ variant })}>
              {icon}
            </div>
          )}

          {/* Title area */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center flex-wrap gap-2">
              <h3 className={toolCardTitleVariants({ variant })}>
                {displayTitle}
              </h3>
              {version && (
                <span className={toolCardVersionVariants({})}>
                  v{version}
                </span>
              )}
            </div>

            {/* Badges */}
            <div className="flex items-center gap-2 mt-1">
              {isOfficial && (
                <span className={toolCardOfficialBadgeVariants({})}>
                  <Icon icon="badgeCheck" size="xs" />
                  official
                </span>
              )}
              {tier && (
                <span className={toolCardTierBadgeVariants({ tier })}>
                  {tier}
                </span>
              )}
              {category && (
                <span className="font-mono text-[10px] text-foreground-muted">
                  {category}
                </span>
              )}
            </div>
          </div>

          {/* Quality score (compact display) */}
          {qualityScore !== undefined && variant !== 'compact' && (
            <div className="flex-shrink-0 text-right">
              <div className="font-mono text-lg font-semibold text-primary">
                {Math.round(qualityScore)}
              </div>
              <div className="font-mono text-[10px] text-foreground-muted uppercase">
                score
              </div>
            </div>
          )}
        </div>

        {/* Description */}
        {description && (
          <p className={toolCardDescriptionVariants({ variant })}>
            {description}
          </p>
        )}

        {/* Meta info */}
        <div className={toolCardMetaVariants({ variant })}>
          {formattedDownloads && (
            <div className={toolCardMetaItemVariants({})}>
              <Icon icon="download" size="xs" />
              {formattedDownloads}
            </div>
          )}

          {stars !== undefined && (
            <div className={toolCardMetaItemVariants({})}>
              <Icon icon="star" size="xs" />
              {stars}
            </div>
          )}

          {author && (
            <div className={toolCardMetaItemVariants({})}>
              <Icon icon="user" size="xs" />
              {author}
            </div>
          )}

          {formattedTime && (
            <div className={toolCardMetaItemVariants({})}>
              <Icon icon="clock" size="xs" />
              {formattedTime}
            </div>
          )}

          {/* Quality score for compact variant */}
          {qualityScore !== undefined && variant === 'compact' && (
            <div className={cn(toolCardMetaItemVariants({}), 'ml-auto')}>
              <span className="text-primary font-semibold">
                {Math.round(qualityScore)}
              </span>
            </div>
          )}
        </div>

        {/* Action slot */}
        {action && (
          <div className={toolCardActionVariants({ variant })}>
            {action}
          </div>
        )}
      </>
    );

    if (isClickable) {
      return (
        <a
          ref={ref as React.Ref<HTMLAnchorElement>}
          href={href}
          className={cardClassName}
          {...(props as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
        >
          {cardContent}
        </a>
      );
    }

    return (
      <div
        ref={ref}
        className={cardClassName}
        {...props}
      >
        {cardContent}
      </div>
    );
  }
);

ToolCard.displayName = 'ToolCard';
