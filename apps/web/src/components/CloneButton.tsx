'use client';

import { Button } from '@tpmjs/ui/Button/Button';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useSession } from '~/lib/auth-client';

interface CloneButtonProps {
  type: 'agent' | 'collection';
  sourceId: string;
  sourceName: string;
  className?: string;
}

export function CloneButton({
  type,
  sourceId,
  sourceName,
  className,
}: CloneButtonProps): React.ReactElement {
  // sourceName is used in the button title
  void sourceName;
  const { data: session } = useSession();
  const router = useRouter();
  const [isCloning, setIsCloning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClone() {
    if (!session?.user) {
      // Redirect to sign in
      router.push(`/sign-in?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    setIsCloning(true);
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
        // Redirect to the cloned item in dashboard
        if (type === 'agent') {
          router.push(`/dashboard/agents/${data.data.id}`);
        } else {
          router.push(`/dashboard/collections/${data.data.id}`);
        }
      } else {
        setError(data.error?.message || 'Failed to clone');
      }
    } catch {
      setError('Failed to clone');
    } finally {
      setIsCloning(false);
    }
  }

  return (
    <div className={className}>
      <Button
        variant="outline"
        onClick={handleClone}
        disabled={isCloning}
        title={`Clone this ${type} to your account`}
      >
        {isCloning ? (
          <Icon icon="loader" className="w-4 h-4 animate-spin mr-2" />
        ) : (
          <Icon icon="copy" className="w-4 h-4 mr-2" />
        )}
        Clone
      </Button>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}
