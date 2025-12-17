/**
 * Tool execution endpoint with SSE streaming
 * Executes TPMJS tools with AI agents and streams real-time progress
 */

import { checkRateLimit, getClientIP } from '@/lib/rate-limiter';
import { prisma } from '@tpmjs/db';
import { type NextRequest, NextResponse } from 'next/server';

// Use Node.js runtime for SSE streaming
export const runtime = 'nodejs';
export const maxDuration = 60; // 60 seconds timeout
export const dynamic = 'force-dynamic'; // Prevent static generation for AI SDK routes

interface ExecuteRequest {
  prompt: string;
  parameters?: Record<string, unknown>;
}

/**
 * POST /api/tools/execute/[...slug]
 * Executes a tool with an AI agent and streams the response via SSE
 *
 * Slug format: [toolId] or [packageName, name]
 * Examples:
 *   /api/tools/execute/clx123abc (by tool ID)
 *   /api/tools/execute/@tpmjs/hello/helloWorldTool (by package and export name)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const { slug } = await params;

  try {
    // Parse request body
    const body = (await request.json()) as ExecuteRequest;
    const { prompt, parameters } = body;

    if (!prompt || prompt.length === 0) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    if (prompt.length > 2000) {
      return NextResponse.json({ error: 'Prompt too long (max 2000 characters)' }, { status: 400 });
    }

    // Get client IP and check rate limit
    const ipAddress = getClientIP(request);
    const rateLimit = await checkRateLimit(ipAddress);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          resetAt: rateLimit.resetAt,
          remaining: 0,
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': '10',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimit.resetAt.toISOString(),
          },
        }
      );
    }

    // Fetch tool from database with package relation
    // Support both ID-based lookup and packageName/name lookup
    const tool =
      slug.length === 1
        ? // Single slug - treat as tool ID
          await prisma.tool.findUnique({
            where: { id: slug[0] || '' },
            include: { package: true },
          })
        : // Multiple slugs - treat as packageName/name
          await prisma.tool.findFirst({
            where: {
              package: { npmPackageName: decodeURIComponent(slug.slice(0, -1).join('/')) },
              name: decodeURIComponent(slug[slug.length - 1] || ''),
            },
            include: { package: true },
          });

    if (!tool) {
      return NextResponse.json({ error: 'Tool not found' }, { status: 404 });
    }

    // Create simulation record
    const simulation = await prisma.simulation.create({
      data: {
        toolId: tool.id,
        userPrompt: prompt,
        // biome-ignore lint/suspicious/noExplicitAny: Prisma Json type compatibility workaround
        parameters: parameters ? (parameters as any) : undefined,
        ipAddress,
        userAgent: request.headers.get('user-agent') || null,
        status: 'running',
        model: 'gpt-4-turbo',
      },
    });

    // Create readable stream for SSE
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        const sendEvent = (event: string, data: unknown) => {
          const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(message));
        };

        try {
          const startTime = Date.now();

          // Dynamically import AI agent to avoid loading tiktoken at build time
          const { executeToolWithAgent } = await import('@/lib/ai-agent/tool-executor-agent');

          // Execute tool with AI agent
          const result = await executeToolWithAgent(
            tool,
            prompt,
            (chunk) => {
              // Stream text chunks
              sendEvent('chunk', { text: chunk });
            },
            (tokens) => {
              // Stream token updates
              sendEvent('tokens', tokens);
            }
          );

          const executionTimeMs = Date.now() - startTime;

          // Update simulation with results
          await prisma.simulation.update({
            where: { id: simulation.id },
            data: {
              status: 'success',
              output: { result: result.output },
              agentSteps: result.agentSteps,
              executionTimeMs,
              completedAt: new Date(),
            },
          });

          // Update tool health status on successful execution
          // This ensures tools marked as BROKEN get updated when they actually work
          if (tool.importHealth === 'BROKEN' || tool.executionHealth === 'BROKEN') {
            await prisma.tool.update({
              where: { id: tool.id },
              data: {
                importHealth: 'HEALTHY',
                executionHealth: 'HEALTHY',
                healthCheckError: null,
                lastHealthCheck: new Date(),
              },
            });
          }

          // Create token usage record
          await prisma.tokenUsage.create({
            data: {
              simulationId: simulation.id,
              inputTokens: result.tokenBreakdown.inputTokens,
              toolDescTokens: result.tokenBreakdown.toolDescTokens,
              schemaTokens: result.tokenBreakdown.schemaTokens,
              outputTokens: result.tokenBreakdown.outputTokens,
              totalTokens: result.tokenBreakdown.totalTokens,
              estimatedCost: result.tokenBreakdown.estimatedCost,
            },
          });

          // Send completion event
          sendEvent('complete', {
            output: result.output,
            tokenBreakdown: result.tokenBreakdown,
            executionTimeMs,
            agentSteps: result.agentSteps,
          });
        } catch (error) {
          // Update simulation with error
          await prisma.simulation.update({
            where: { id: simulation.id },
            data: {
              status: 'error',
              error: error instanceof Error ? error.message : 'Unknown error',
              completedAt: new Date(),
            },
          });

          // Send error event
          sendEvent('error', {
            message: error instanceof Error ? error.message : 'Unknown error',
          });
        } finally {
          controller.close();
        }
      },
    });

    // Return SSE stream
    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'X-RateLimit-Limit': '10',
        'X-RateLimit-Remaining': rateLimit.remaining.toString(),
      },
    });
  } catch (error) {
    console.error('Execute endpoint error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
