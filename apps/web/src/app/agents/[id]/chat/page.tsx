'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';

function generateConversationId(): string {
  return `conv-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * Redirect to a new chat with a generated conversation ID
 */
export default function PublicAgentChatRedirect(): React.ReactElement {
  const params = useParams();
  const router = useRouter();
  const agentId = params.id as string;

  useEffect(() => {
    const newId = generateConversationId();
    router.replace(`/agents/${agentId}/chat/${newId}`);
  }, [agentId, router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="animate-pulse text-foreground-secondary">Loading chat...</div>
    </div>
  );
}
