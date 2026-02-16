import { prisma } from '@tpmjs/db';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod/v4';

import { logActivity } from '~/lib/activity';
import { authenticateRequest } from '~/lib/api-keys/middleware';

export const runtime = 'nodejs';
export const maxDuration = 60;

const MAX_WORKFLOWS_PER_USER = 50;

function generateUid(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50);
}

const CreateWorkflowSchema = z.object({
  name: z.string().min(1).max(100),
  uid: z.string().max(100).optional(),
  description: z.string().max(2000).optional(),
  triggerType: z.enum(['MANUAL', 'WEBHOOK', 'SCHEDULE']).optional(),
});

/**
 * GET /api/workflows
 * List all workflows owned by the authenticated user
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const authResult = await authenticateRequest();
    if (!authResult.authenticated || !authResult.userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number.parseInt(searchParams.get('limit') || '20', 10), 50);
    const offset = Number.parseInt(searchParams.get('offset') || '0', 10);

    const workflows = await prisma.workflow.findMany({
      where: { userId: authResult.userId },
      select: {
        id: true,
        uid: true,
        name: true,
        description: true,
        status: true,
        triggerType: true,
        executionCount: true,
        lastExecutedAt: true,
        version: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            nodes: true,
            edges: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: limit + 1,
      skip: offset,
    });

    const hasMore = workflows.length > limit;
    const data = hasMore ? workflows.slice(0, limit) : workflows;

    return NextResponse.json({
      success: true,
      data: data.map((w) => ({
        ...w,
        nodeCount: w._count.nodes,
        edgeCount: w._count.edges,
        _count: undefined,
      })),
      pagination: {
        limit,
        offset,
        count: data.length,
        hasMore,
      },
    });
  } catch (error) {
    console.error('Failed to list workflows:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to list workflows' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/workflows
 * Create a new workflow
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const authResult = await authenticateRequest();
    if (!authResult.authenticated || !authResult.userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const userId = authResult.userId;

    const body = await request.json();
    const parsed = CreateWorkflowSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Check workflow limit
    const workflowCount = await prisma.workflow.count({
      where: { userId },
    });
    if (workflowCount >= MAX_WORKFLOWS_PER_USER) {
      return NextResponse.json(
        { success: false, error: `Maximum ${MAX_WORKFLOWS_PER_USER} workflows allowed` },
        { status: 400 }
      );
    }

    const { name, uid, description, triggerType } = parsed.data;

    // Generate UID if not provided
    let finalUid = uid || generateUid(name);

    // Check for UID uniqueness
    const existingByUid = await prisma.workflow.findUnique({ where: { uid: finalUid } });
    if (existingByUid) {
      finalUid = `${finalUid}-${Math.random().toString(36).slice(2, 6)}`;
    }

    // Check for name uniqueness within user's workflows
    const existingByName = await prisma.workflow.findFirst({
      where: { userId, name },
    });
    if (existingByName) {
      return NextResponse.json(
        { success: false, error: 'A workflow with this name already exists' },
        { status: 409 }
      );
    }

    const workflow = await prisma.workflow.create({
      data: {
        userId,
        uid: finalUid,
        name,
        description,
        triggerType: triggerType || 'MANUAL',
        status: 'DRAFT',
      },
      select: {
        id: true,
        uid: true,
        name: true,
        description: true,
        status: true,
        triggerType: true,
        version: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Log activity (fire-and-forget)
    logActivity({
      userId,
      type: 'WORKFLOW_CREATED',
      targetName: workflow.name,
      targetType: 'workflow',
    });

    return NextResponse.json(
      {
        success: true,
        data: workflow,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Failed to create workflow:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create workflow' },
      { status: 500 }
    );
  }
}
