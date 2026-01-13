'use client';

import { Icon } from '@tpmjs/ui/Icon/Icon';
import Link from 'next/link';

interface ForkedFromInfo {
  id: string;
  name: string;
  slug?: string;
  uid?: string;
  user?: {
    username: string;
  };
}

interface ForkedFromBadgeProps {
  type: 'agent' | 'collection';
  forkedFrom: ForkedFromInfo | null;
  className?: string;
}

export function ForkedFromBadge({
  type,
  forkedFrom,
  className,
}: ForkedFromBadgeProps): React.ReactElement | null {
  if (!forkedFrom) {
    return null;
  }

  // Build the link to the original
  let href: string;
  if (forkedFrom.user?.username) {
    if (type === 'agent' && forkedFrom.uid) {
      href = `/${forkedFrom.user.username}/agents/${forkedFrom.uid}`;
    } else if (type === 'collection' && forkedFrom.slug) {
      href = `/${forkedFrom.user.username}/collections/${forkedFrom.slug}`;
    } else {
      // Fallback to ID-based URL
      href = type === 'agent' ? `/agents/${forkedFrom.id}` : `/collections/${forkedFrom.id}`;
    }
  } else {
    // No username available, use ID-based URL
    href = type === 'agent' ? `/agents/${forkedFrom.id}` : `/collections/${forkedFrom.id}`;
  }

  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-1.5 text-sm text-foreground-secondary hover:text-foreground transition-colors ${className || ''}`}
    >
      <Icon icon="gitFork" className="w-3.5 h-3.5" />
      <span>
        Forked from{' '}
        <span className="font-medium text-foreground-secondary hover:text-foreground">
          {forkedFrom.name}
        </span>
      </span>
    </Link>
  );
}
