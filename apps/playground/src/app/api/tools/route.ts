import { searchTpmjsToolsTool } from '@tpmjs/search-registry';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Search for all tools (empty query returns all)
    const result = await searchTpmjsToolsTool.execute({
      query: '',
      limit: 100,
    });

    return NextResponse.json({
      success: true,
      tools: result.tools,
      total: result.total,
    });
  } catch (error) {
    console.error('Failed to fetch tools:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch tools',
      },
      { status: 500 }
    );
  }
}
