'use client';

import { Button } from '@tpmjs/ui/Button/Button';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSession } from '~/lib/auth-client';

interface ForkStatus {
  hasFork: boolean;
  fork: { id: string; slug?: string; uid?: string; name: string } | null;
  isOwner: boolean;
  canFork: boolean;
}

interface ForkButtonProps {
  type: 'agent' | 'collection';
  sourceId: string;
  sourceName: string;
  className?: string;
  /** Show full-width variant with description text */
  variant?: 'compact' | 'full';
}

export function ForkButton({
  type,
  sourceId,
  sourceName,
  className,
  variant = 'compact',
}: ForkButtonProps): React.ReactElement {
  void sourceName;
  const { data: session } = useSession();
  const router = useRouter();
  const [isForking, setIsForking] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forkStatus, setForkStatus] = useState<ForkStatus | null>(null);

  // Fetch fork status on mount
  useEffect(() => {
    if (!session?.user) {
      setIsLoading(false);
      return;
    }

    async function checkForkStatus() {
      try {
        const endpoint =
          type === 'agent'
            ? `/api/agents/${sourceId}/fork-status`
            : `/api/collections/${sourceId}/fork-status`;

        const response = await fetch(endpoint);
        const data = await response.json();

        if (data.success) {
          setForkStatus(data.data);
        }
      } catch {
        // Silently fail - will show fork button as fallback
      } finally {
        setIsLoading(false);
      }
    }

    checkForkStatus();
  }, [session?.user, sourceId, type]);

  async function handleFork() {
    if (!session?.user) {
      router.push(`/sign-in?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    setIsForking(true);
    setError(null);

    try {
      const endpoint =
        type === 'agent' ? `/api/agents/${sourceId}/clone` : `/api/collections/${sourceId}/clone`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      if (data.success) {
        // Redirect to the forked item in dashboard
        if (type === 'agent') {
          router.push(`/dashboard/agents/${data.data.id}`);
        } else {
          router.push(`/dashboard/collections/${data.data.id}`);
        }
      } else {
        setError(data.error?.message || 'Failed to fork');
      }
    } catch {
      setError('Failed to fork');
    } finally {
      setIsForking(false);
    }
  }

  // Not logged in - show sign in prompt
  if (!session?.user) {
    if (variant === 'full') {
      return (
        <div className={`p-4 bg-surface border border-border rounded-lg ${className || ''}`}>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Icon icon="gitFork" className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium text-foreground">Fork to Use</h3>
              <p className="text-sm text-foreground-secondary">
                Sign in to fork this {type} to your account
              </p>
            </div>
          </div>
          <Link
            href={`/sign-in?redirect=${encodeURIComponent(typeof window !== 'undefined' ? window.location.pathname : '')}`}
          >
            <Button className="w-full mt-2">
              <Icon icon="user" className="w-4 h-4 mr-2" />
              Sign In to Fork
            </Button>
          </Link>
        </div>
      );
    }
    return (
      <div className={className}>
        <Link href="/sign-in">
          <Button variant="outline" title={`Sign in to fork this ${type}`}>
            <Icon icon="gitFork" className="w-4 h-4 mr-2" />
            Fork
          </Button>
        </Link>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className={className}>
        <Button variant="outline" disabled>
          <Icon icon="loader" className="w-4 h-4 animate-spin mr-2" />
          {variant === 'full' ? 'Loading...' : ''}
        </Button>
      </div>
    );
  }

  // Owner - show "Your" badge
  if (forkStatus?.isOwner) {
    if (variant === 'full') {
      return (
        <div
          className={`p-4 bg-green-500/10 border border-green-500/20 rounded-lg ${className || ''}`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <Icon icon="check" className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-medium text-foreground">
                Your {type === 'agent' ? 'Agent' : 'Collection'}
              </h3>
              <p className="text-sm text-foreground-secondary">You own this {type}</p>
            </div>
          </div>
        </div>
      );
    }
    return (
      <div className={className}>
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 text-green-700 rounded-lg text-sm font-medium">
          <Icon icon="check" className="w-4 h-4" />
          Your {type === 'agent' ? 'Agent' : 'Collection'}
        </span>
      </div>
    );
  }

  // Already forked - show link to fork
  if (forkStatus?.hasFork && forkStatus.fork) {
    const forkUrl =
      type === 'agent'
        ? `/dashboard/agents/${forkStatus.fork.id}`
        : `/dashboard/collections/${forkStatus.fork.id}`;

    if (variant === 'full') {
      return (
        <div
          className={`p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg ${className || ''}`}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Icon icon="gitFork" className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium text-foreground">Already Forked</h3>
              <p className="text-sm text-foreground-secondary">
                You have a fork: &ldquo;{forkStatus.fork.name}&rdquo;
              </p>
            </div>
          </div>
          <Link href={forkUrl}>
            <Button variant="secondary" className="w-full mt-2">
              <Icon icon="externalLink" className="w-4 h-4 mr-2" />
              View Your Fork
            </Button>
          </Link>
        </div>
      );
    }
    return (
      <div className={className}>
        <Link href={forkUrl}>
          <Button variant="outline" title="View your forked version">
            <Icon icon="gitFork" className="w-4 h-4 mr-2" />
            View Fork
          </Button>
        </Link>
      </div>
    );
  }

  // Can't fork (over limit)
  if (!forkStatus?.canFork) {
    if (variant === 'full') {
      return (
        <div
          className={`p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg ${className || ''}`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 rounded-lg">
              <Icon icon="alertTriangle" className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="font-medium text-foreground">Limit Reached</h3>
              <p className="text-sm text-foreground-secondary">
                You&apos;ve reached the maximum number of{' '}
                {type === 'agent' ? 'agents' : 'collections'}
              </p>
            </div>
          </div>
        </div>
      );
    }
    return (
      <div className={className}>
        <Button variant="outline" disabled title={`${type} limit reached`}>
          <Icon icon="gitFork" className="w-4 h-4 mr-2" />
          Limit Reached
        </Button>
      </div>
    );
  }

  // Can fork - show fork button
  if (variant === 'full') {
    return (
      <div className={`p-4 bg-surface border border-border rounded-lg ${className || ''}`}>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Icon icon="gitFork" className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-medium text-foreground">Fork to Use</h3>
            <p className="text-sm text-foreground-secondary">
              Fork this {type} to your account to use it with your own API keys
            </p>
          </div>
        </div>
        <Button onClick={handleFork} disabled={isForking} className="w-full mt-2">
          {isForking ? (
            <Icon icon="loader" className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <Icon icon="gitFork" className="w-4 h-4 mr-2" />
          )}
          Fork {type === 'agent' ? 'Agent' : 'Collection'}
        </Button>
        {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
      </div>
    );
  }

  return (
    <div className={className}>
      <Button
        variant="outline"
        onClick={handleFork}
        disabled={isForking}
        title={`Fork this ${type} to your account`}
      >
        {isForking ? (
          <Icon icon="loader" className="w-4 h-4 animate-spin mr-2" />
        ) : (
          <Icon icon="gitFork" className="w-4 h-4 mr-2" />
        )}
        Fork
      </Button>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}
