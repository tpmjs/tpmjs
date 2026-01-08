'use client';

import { notFound, useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

/**
 * Chat page for pretty URLs.
 * This redirects to the existing chat system with the agent ID.
 */
export default function PrettyChatPage(): React.ReactElement {
  const params = useParams();
  const router = useRouter();
  const rawUsername = params.username as string;
  const username = rawUsername.startsWith('@') ? rawUsername.slice(1) : rawUsername;
  const uid = params.uid as string;

  const [isLoading, setIsLoading] = useState(true);
  const [notFoundError, setNotFoundError] = useState(false);

  const resolveAndRedirect = useCallback(async () => {
    try {
      // Fetch the agent to get its ID
      const response = await fetch(`/api/public/users/${username}/agents/${uid}`);

      if (response.status === 404) {
        setNotFoundError(true);
        return;
      }

      const data = await response.json();

      if (data.success && data.data?.id) {
        // Redirect to the agent chat page using the agent ID
        router.replace(`/agents/${data.data.id}/chat`);
      } else {
        setNotFoundError(true);
      }
    } catch {
      setNotFoundError(true);
    } finally {
      setIsLoading(false);
    }
  }, [username, uid, router]);

  useEffect(() => {
    resolveAndRedirect();
  }, [resolveAndRedirect]);

  if (notFoundError) {
    notFound();
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground" />
      </div>
    );
  }

  // Returning empty fragment while redirect happens
  return <></>;
}
