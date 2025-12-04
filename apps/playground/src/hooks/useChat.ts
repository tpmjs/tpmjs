'use client';

import { useChat as useAISDKChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { nanoid } from 'nanoid';
import { useState } from 'react';

/**
 * Custom chat hook that wraps the official @ai-sdk/react useChat
 * Handles SSE streaming with tool calls and UI message protocol
 * Includes conversation ID tracking for dynamic tool loading
 */
const ENV_STORAGE_KEY = 'tpmjs-playground-env-vars';

export function useChat(): ReturnType<typeof useAISDKChat> & { conversationId: string } {
  // Generate stable conversation ID for session
  const [conversationId] = useState(() => nanoid());

  const chat = useAISDKChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
      // Use function body that reads FRESH from localStorage on each request
      // This avoids React closure issues where envVars would be stale
      body: () => {
        // Read env vars directly from localStorage (not from React state)
        let envVars: Array<{ key: string; value: string }> = [];
        try {
          const stored = localStorage.getItem(ENV_STORAGE_KEY);
          if (stored) {
            envVars = JSON.parse(stored);
          }
        } catch (error) {
          console.error('Failed to read env vars from localStorage:', error);
        }

        // Convert to object format
        const env = envVars.reduce(
          (acc, { key, value }) => {
            acc[key] = value;
            return acc;
          },
          {} as Record<string, string>
        );

        console.log('🔑 [useChat] Reading env vars from localStorage:', Object.keys(env));

        return {
          conversationId,
          env,
        };
      },
    }),
  });

  return {
    ...chat,
    conversationId,
  };
}
