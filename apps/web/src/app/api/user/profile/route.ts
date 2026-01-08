import { prisma } from '@tpmjs/db';
import { RESERVED_USERNAMES, USERNAME_REGEX, UpdateUserProfileSchema } from '@tpmjs/types/user';
import { headers } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';

import { auth } from '~/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/user/profile
 * Get the current user's profile
 */
export async function GET(): Promise<NextResponse> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        image: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Failed to get user profile:', error);
    return NextResponse.json({ success: false, error: 'Failed to get profile' }, { status: 500 });
  }
}

/**
 * PATCH /api/user/profile
 * Update the current user's profile
 */
export async function PATCH(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const result = UpdateUserProfileSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid input',
          details: result.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { name, username, image } = result.data;

    // If updating username, validate availability
    if (username) {
      // Check if reserved
      if ((RESERVED_USERNAMES as readonly string[]).includes(username)) {
        return NextResponse.json(
          {
            success: false,
            error: 'This username is reserved',
          },
          { status: 400 }
        );
      }

      // Check regex
      if (!USERNAME_REGEX.test(username)) {
        return NextResponse.json(
          {
            success: false,
            error: 'Username must be lowercase alphanumeric with single hyphens only',
          },
          { status: 400 }
        );
      }

      // Check if already taken by another user
      const existingUser = await prisma.user.findFirst({
        where: {
          username,
          NOT: { id: session.user.id },
        },
        select: { id: true },
      });

      if (existingUser) {
        return NextResponse.json(
          {
            success: false,
            error: 'This username is already taken',
          },
          { status: 400 }
        );
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...(name !== undefined && { name }),
        ...(username !== undefined && { username }),
        ...(image !== undefined && { image }),
      },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        image: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedUser,
    });
  } catch (error) {
    console.error('Failed to update user profile:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
