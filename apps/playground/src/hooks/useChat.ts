'use client';

import { useChat as useAISDKChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { nanoid } from 'nanoid';
import { useState } from 'react';
import { useEnvVars } from '~/components/sidebar/SettingsSidebar';

/**
 * Custom chat hook that wraps the official @ai-sdk/react useChat
 * Handles SSE streaming with tool calls and UI message protocol
 * Includes conversation ID tracking for dynamic tool loading
 */
export function useChat(): ReturnType<typeof useAISDKChat> & { conversationId: string } {
  // Generate stable conversation ID for session
  const [conversationId] = useState(() => nanoid());

  // Get environment variables from settings sidebar
  const envVars = useEnvVars();

  // Convert env vars to object format (called fresh on each request)
  const buildEnvObject = () =>
    envVars.reduce(
      (acc, { key, value }) => {
        acc[key] = value;
        return acc;
      },
      {} as Record<string, string>
    );

  const chat = useAISDKChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
      // Use function body so it's evaluated on each request (not just once on mount)
      body: () => ({
        conversationId, // Pass conversation ID to API
        env: buildEnvObject(), // Pass LATEST environment variables to API
      }),
    }),
  });

  return {
    ...chat,
    conversationId,
  };
}
