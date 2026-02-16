import { type Prisma, prisma } from '@tpmjs/db';
import type { NextRequest } from 'next/server';

import { logActivity } from '~/lib/activity';
import { authenticateRequest } from '~/lib/api-keys/middleware';
import { executeWorkflow } from '~/lib/workflows/execute';

export const runtime = 'nodejs';
export const maxDuration = 300;

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * POST /api/workflows/[id]/execute
 * Start a workflow execution, streaming SSE progress events
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const authResult = await authenticateRequest();
    if (!authResult.authenticated || !authResult.userId) {
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { id } = await context.params;

    // Check ownership
    const workflow = await prisma.workflow.findUnique({
      where: { id },
      select: { userId: true, name: true, version: true },
    });

    if (!workflow) {
      return new Response(JSON.stringify({ success: false, error: 'Workflow not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (workflow.userId !== authResult.userId) {
      return new Response(JSON.stringify({ success: false, error: 'Access denied' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Parse optional trigger input
    let triggerInput: Record<string, unknown> = {};
    try {
      const body = await request.json();
      if (body.triggerInput && typeof body.triggerInput === 'object') {
        triggerInput = body.triggerInput;
      }
    } catch {
      // No body or invalid JSON - use empty trigger input
    }

    // Create execution record
    const execution = await prisma.workflowExecution.create({
      data: {
        workflowId: id,
        status: 'RUNNING',
        triggeredBy: 'manual',
        triggerInput: triggerInput as Prisma.InputJsonValue,
        workflowVersion: workflow.version,
        startedAt: new Date(),
      },
    });

    // Set up SSE stream
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const sendEvent = (event: string, data: unknown) => {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        };

        try {
          sendEvent('execution_start', {
            executionId: execution.id,
            workflowId: id,
          });

          const result = await executeWorkflow(
            id,
            triggerInput,
            authResult.userId!,
            (nodeId, status, output, error) => {
              if (status === 'running') {
                sendEvent('node_start', { nodeId });
              } else if (status === 'completed') {
                sendEvent('node_complete', { nodeId, output });
              } else if (status === 'failed') {
                sendEvent('node_error', { nodeId, error });
              } else if (status === 'skipped') {
                sendEvent('node_skipped', { nodeId });
              }
            }
          );

          // Update execution record
          const completedAt = new Date();
          await prisma.workflowExecution.update({
            where: { id: execution.id },
            data: {
              status: result.success ? 'COMPLETED' : 'FAILED',
              output: (result.output as Prisma.InputJsonValue) ?? undefined,
              error: result.error,
              completedAt,
              durationMs: completedAt.getTime() - execution.startedAt!.getTime(),
            },
          });

          // Update workflow execution count
          await prisma.workflow.update({
            where: { id },
            data: {
              executionCount: { increment: 1 },
              lastExecutedAt: completedAt,
            },
          });

          sendEvent('workflow_complete', {
            executionId: execution.id,
            success: result.success,
            output: result.output,
            error: result.error,
          });

          // Log activity (fire-and-forget)
          logActivity({
            userId: authResult.userId!,
            type: 'WORKFLOW_EXECUTED',
            targetName: workflow.name,
            targetType: 'workflow',
          });
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Unknown error';

          await prisma.workflowExecution.update({
            where: { id: execution.id },
            data: {
              status: 'FAILED',
              error: errorMessage,
              completedAt: new Date(),
            },
          });

          sendEvent('workflow_error', {
            executionId: execution.id,
            error: errorMessage,
          });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Failed to execute workflow:', error);
    return new Response(JSON.stringify({ success: false, error: 'Failed to execute workflow' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
