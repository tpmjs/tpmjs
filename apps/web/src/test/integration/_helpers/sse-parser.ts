/**
 * SSE (Server-Sent Events) parsing utilities for integration tests
 *
 * Used for testing streaming endpoints like agent conversations.
 */

export interface SSEEvent {
  event: string;
  data: unknown;
  id?: string;
}

/**
 * Collect SSE events from a streaming response
 */
export async function collectSSEEvents(
  response: Response,
  options: {
    timeout?: number;
    maxEvents?: number;
  } = {}
): Promise<SSEEvent[]> {
  const { timeout = 30000, maxEvents = 1000 } = options;

  if (!response.body) {
    throw new Error('Response has no body');
  }

  const events: SSEEvent[] = [];
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(`SSE collection timed out after ${timeout}ms`)), timeout);
  });

  try {
    await Promise.race([
      (async () => {
        while (events.length < maxEvents) {
          const { done, value } = await reader.read();

          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // Process complete events in buffer
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // Keep incomplete line in buffer

          let currentEvent = '';
          let currentData = '';
          let currentId: string | undefined;

          for (const line of lines) {
            if (line.startsWith('event: ')) {
              currentEvent = line.slice(7);
            } else if (line.startsWith('data: ')) {
              currentData = line.slice(6);
              if (currentEvent && currentData) {
                try {
                  events.push({
                    event: currentEvent,
                    data: JSON.parse(currentData),
                    id: currentId,
                  });
                } catch {
                  events.push({
                    event: currentEvent,
                    data: currentData,
                    id: currentId,
                  });
                }
                currentEvent = '';
                currentData = '';
                currentId = undefined;
              }
            } else if (line.startsWith('id: ')) {
              currentId = line.slice(4);
            }
          }
        }
      })(),
      timeoutPromise,
    ]);
  } finally {
    reader.releaseLock();
  }

  return events;
}

/**
 * Find an SSE event by event type
 */
export function findSSEEvent(events: SSEEvent[], eventType: string): SSEEvent | undefined {
  return events.find((e) => e.event === eventType);
}

/**
 * Filter SSE events by event type
 */
export function filterSSEEvents(events: SSEEvent[], eventType: string): SSEEvent[] {
  return events.filter((e) => e.event === eventType);
}

/**
 * Extract text content from chunk events
 */
export function extractTextFromChunks(events: SSEEvent[]): string {
  return events
    .filter((e) => e.event === 'chunk')
    .map((e) => {
      const data = e.data as { text?: string };
      return data.text || '';
    })
    .join('');
}
