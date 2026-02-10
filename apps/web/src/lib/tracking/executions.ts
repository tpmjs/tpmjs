import { prisma } from '@tpmjs/db';

export interface TrackExecutionParams {
  eventType: 'tool_call' | 'agent_run' | 'collection_use' | 'scenario_run';
  source: 'mcp_http' | 'mcp_sse' | 'agent_chat' | 'ui_simulation' | 'scenario' | 'omega';
  userId?: string;
  apiKeyId?: string;
  toolId?: string;
  agentId?: string;
  collectionId?: string;
  toolName?: string;
  packageName?: string;
  status: 'success' | 'error' | 'timeout';
  durationMs?: number;
  tokensIn?: number;
  tokensOut?: number;
  errorCode?: string;
  errorMessage?: string;
}

/**
 * Track an execution event (fire-and-forget pattern).
 * Never throws - failures are logged but don't break the main operation.
 */
export function trackExecution(params: TrackExecutionParams): void {
  prisma.executionEvent
    .create({
      data: {
        eventType: params.eventType,
        source: params.source,
        userId: params.userId,
        apiKeyId: params.apiKeyId,
        toolId: params.toolId,
        agentId: params.agentId,
        collectionId: params.collectionId,
        toolName: params.toolName,
        packageName: params.packageName,
        status: params.status,
        durationMs: params.durationMs,
        tokensIn: params.tokensIn,
        tokensOut: params.tokensOut,
        errorCode: params.errorCode,
        errorMessage: params.errorMessage,
      },
    })
    .catch((error) => {
      console.error('[trackExecution] Failed to record execution event:', error);
    });
}

/**
 * Clean up old execution events.
 * Intended to be called from a cron job.
 */
export async function cleanupOldExecutionEvents(daysToKeep = 90): Promise<number> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - daysToKeep);

  const result = await prisma.executionEvent.deleteMany({
    where: { createdAt: { lt: cutoff } },
  });

  return result.count;
}
