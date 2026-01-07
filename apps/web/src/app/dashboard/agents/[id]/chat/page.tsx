'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { DashboardLayout } from '~/components/dashboard/DashboardLayout';

function generateConversationId(): string {
  return `conv-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * Redirect to a new chat with a generated conversation ID
 */
export default function DashboardAgentChatRedirect(): React.ReactElement {
  const params = useParams();
  const router = useRouter();
  const agentId = params.id as string;

  useEffect(() => {
    const newId = generateConversationId();
    router.replace(`/dashboard/agents/${agentId}/chat/${newId}`);
  }, [agentId, router]);

  return (
    <DashboardLayout title="Loading..." showBackButton backUrl={`/dashboard/agents/${agentId}`}>
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-foreground-secondary">Loading chat...</div>
      </div>
    </DashboardLayout>
  );
}
