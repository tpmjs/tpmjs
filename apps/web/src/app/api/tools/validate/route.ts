import { validateTpmjsField } from '@tpmjs/types/tpmjs';
import { type NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

/**
 * POST /api/tools/validate
 * Validate a tpmjs field and determine its tier
 *
 * Body: JSON object representing the tpmjs field
 *
 * Returns:
 * - valid: boolean indicating if the field is valid
 * - tier: 'minimal' | 'rich' | null
 * - data: validated data if valid
 * - errors: validation errors if invalid
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate the tpmjs field
    const result = validateTpmjsField(body);

    // Format errors for better readability
    if (!result.valid && result.errors) {
      return NextResponse.json(
        {
          success: false,
          valid: false,
          tier: null,
          errors: result.errors.issues.map((issue) => ({
            path: issue.path.join('.'),
            message: issue.message,
            code: issue.code,
          })),
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      valid: result.valid,
      tier: result.tier,
      data: result.data,
    });
  } catch (error) {
    console.error('Error validating tpmjs field:', error);

    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid JSON',
          message: 'The request body must be valid JSON',
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Validation failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
