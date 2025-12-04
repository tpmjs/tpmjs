import { searchTpmjsToolsTool } from '@tpmjs/search-registry';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Search for all tools (empty query returns all)
    // biome-ignore lint/style/noNonNullAssertion: Tool created with tool() always has execute
    const result = await searchTpmjsToolsTool.execute!(
      {
        query: '',
        limit: 100,
      },
      {} as any
    );

    // Type assertion: searchTpmjsToolsTool returns direct result, not AsyncIterable
    const searchResult = result as { query: string; matchCount: number; tools: any[] };

    return NextResponse.json({
      success: true,
      tools: searchResult.tools,
      total: searchResult.matchCount,
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
