'use client';

import { useChat as useAISDKChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';

/**
 * Custom chat hook that wraps the official @ai-sdk/react useChat
 * Handles SSE streaming with tool calls and UI message protocol
 */
export function useChat() {
  return useAISDKChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
    }),
  });
}
