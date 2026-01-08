/**
 * Executor Verification Endpoint
 *
 * POST: Verify that a custom executor URL is reachable and implements the API correctly
 */

import { VerifyExecutorRequestSchema } from '@tpmjs/types/executor';
import { type NextRequest, NextResponse } from 'next/server';

import { verifyExecutor } from '~/lib/executors';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

/**
 * POST /api/executors/verify
 * Verify a custom executor URL
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();

    // Validate request
    const parsed = VerifyExecutorRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request',
            details: parsed.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const { url, apiKey } = parsed.data;

    // Validate URL format and security
    try {
      const parsedUrl = new URL(url);

      // Require HTTPS in production
      if (process.env.NODE_ENV === 'production' && parsedUrl.protocol !== 'https:') {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'INSECURE_URL',
              message: 'Custom executor URL must use HTTPS in production',
            },
          },
          { status: 400 }
        );
      }

      // Block internal/private IPs in production
      if (process.env.NODE_ENV === 'production') {
        const hostname = parsedUrl.hostname;
        if (
          hostname === 'localhost' ||
          hostname === '127.0.0.1' ||
          hostname.startsWith('192.168.') ||
          hostname.startsWith('10.') ||
          hostname.startsWith('172.16.') ||
          hostname.endsWith('.local')
        ) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'PRIVATE_URL',
                message: 'Custom executor URL cannot point to private/internal addresses',
              },
            },
            { status: 400 }
          );
        }
      }
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_URL',
            message: 'Invalid URL format',
          },
        },
        { status: 400 }
      );
    }

    // Verify the executor
    const result = await verifyExecutor(url, apiKey);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Failed to verify executor:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'VERIFICATION_ERROR',
          message: error instanceof Error ? error.message : 'Failed to verify executor',
        },
      },
      { status: 500 }
    );
  }
}
