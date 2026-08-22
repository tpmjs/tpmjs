import { prisma } from '@tpmjs/db';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '~/lib/admin';

export const runtime = 'nodejs';
export const maxDuration = 60;

const UpdateUserSchema = z
  .object({
    role: z.enum(['USER', 'ADMIN']).optional(),
    tier: z.enum(['FREE', 'PRO', 'ENTERPRISE']).optional(),
  })
  .strict()
  .refine((value) => value.role !== undefined || value.tier !== undefined, {
    message: 'Provide role and/or tier',
  });

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * PATCH /api/admin/users/[id]
 * Change a user's role (make/revoke admin) or tier. Requires ADMIN role.
 * An admin cannot revoke their own admin role, and the last admin cannot be demoted.
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  let session: Awaited<ReturnType<typeof requireAdmin>>;
  try {
    session = await requireAdmin();
  } catch (response) {
    if (response instanceof Response) return response;
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await context.params;
  const parsed = UpdateUserSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues.map((issue) => issue.message).join('; ') },
      { status: 400 }
    );
  }

  const target = await prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, role: true, tier: true },
  });
  if (!target) {
    return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
  }

  if (parsed.data.role === 'USER' && target.role === 'ADMIN') {
    if (target.id === session.user.id) {
      return NextResponse.json(
        { success: false, error: 'You cannot revoke your own admin role' },
        { status: 400 }
      );
    }
    const admins = await prisma.user.count({ where: { role: 'ADMIN' } });
    if (admins <= 1) {
      return NextResponse.json(
        { success: false, error: 'Cannot demote the last remaining admin' },
        { status: 400 }
      );
    }
  }

  const updated = await prisma.user.update({
    where: { id },
    data: {
      ...(parsed.data.role !== undefined && { role: parsed.data.role }),
      ...(parsed.data.tier !== undefined && { tier: parsed.data.tier }),
    },
    select: { id: true, email: true, username: true, role: true, tier: true },
  });

  console.log(
    `[admin] ${session.user.email} set ${updated.email} role=${updated.role} tier=${updated.tier}`
  );

  return NextResponse.json({ success: true, data: updated });
}
