import { prisma } from '@tpmjs/db';
import { CheckUsernameSchema, RESERVED_USERNAMES, USERNAME_REGEX } from '@tpmjs/types/user';
import { type NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/user/username/check?username=xxx
 * Check if a username is available
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const usernameParam = searchParams.get('username');

    if (!usernameParam) {
      return NextResponse.json(
        {
          success: false,
          error: 'Username parameter is required',
        },
        { status: 400 }
      );
    }

    // Validate and normalize
    const result = CheckUsernameSchema.safeParse({ username: usernameParam });
    if (!result.success) {
      const issues = result.error.issues;
      return NextResponse.json({
        success: true,
        data: {
          username: usernameParam.toLowerCase(),
          available: false,
          reason: issues[0]?.message || 'Invalid username format',
        },
      });
    }

    const username = result.data.username;

    // Check if reserved
    if ((RESERVED_USERNAMES as readonly string[]).includes(username)) {
      return NextResponse.json({
        success: true,
        data: {
          username,
          available: false,
          reason: 'This username is reserved',
        },
      });
    }

    // Check regex format
    if (!USERNAME_REGEX.test(username)) {
      return NextResponse.json({
        success: true,
        data: {
          username,
          available: false,
          reason: 'Username must be lowercase alphanumeric with single hyphens only',
        },
      });
    }

    // Check database
    const existingUser = await prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });

    if (existingUser) {
      return NextResponse.json({
        success: true,
        data: {
          username,
          available: false,
          reason: 'This username is already taken',
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        username,
        available: true,
      },
    });
  } catch (error) {
    console.error('Failed to check username:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to check username',
      },
      { status: 500 }
    );
  }
}
