import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { type NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

interface ToolIdea {
  name: string;
  description: string;
  category: string;
  parameters: Array<{
    name: string;
    type: string;
    description: string;
    required: boolean;
    defaultValue: string;
  }>;
  returns: {
    type: string;
    description: string;
  };
  aiAgent: {
    useCase: string;
    limitations: string;
    examples: string[];
  };
  tags: string[];
  examples: Array<{
    inputJson: string;
    description: string;
  }>;
  qualityScore: number;
  skeleton: {
    verb: string;
    object: string;
    context: string | null;
  };
}

interface ToolIdeasData {
  metadata: {
    exportedAt: string;
    count: number;
    minQuality: number;
    excludeNonsensical: boolean;
  };
  tools: ToolIdea[];
}

// Cache the data in memory
let cachedData: ToolIdeasData | null = null;

function loadToolIdeas(): ToolIdeasData {
  if (cachedData) {
    return cachedData;
  }

  try {
    // On Vercel, public files are in the project root under 'public'
    const filePath = join(process.cwd(), 'public', 'tools-export.json');
    const fileContent = readFileSync(filePath, 'utf-8');
    cachedData = JSON.parse(fileContent) as ToolIdeasData;
    return cachedData;
  } catch (error) {
    console.error('Failed to load tool ideas:', error);
    return {
      metadata: { exportedAt: '', count: 0, minQuality: 0, excludeNonsensical: false },
      tools: [],
    };
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const search = searchParams.get('search')?.toLowerCase() || '';
  const category = searchParams.get('category') || '';
  const minQuality = Number.parseFloat(searchParams.get('minQuality') || '0');
  const verb = searchParams.get('verb') || '';
  const limit = Math.min(Number.parseInt(searchParams.get('limit') || '100'), 10000);
  const offset = Number.parseInt(searchParams.get('offset') || '0');

  const data = loadToolIdeas();
  let tools = data.tools;

  // Apply filters
  if (search) {
    tools = tools.filter(
      (t) =>
        t.name.toLowerCase().includes(search) ||
        t.description.toLowerCase().includes(search) ||
        t.tags.some((tag) => tag.toLowerCase().includes(search))
    );
  }

  if (category) {
    tools = tools.filter((t) => t.category === category);
  }

  if (minQuality > 0) {
    tools = tools.filter((t) => t.qualityScore >= minQuality);
  }

  if (verb) {
    tools = tools.filter((t) => t.skeleton.verb === verb);
  }

  const totalCount = tools.length;

  // Apply pagination
  const paginatedTools = tools.slice(offset, offset + limit);

  // Get unique categories and verbs for filters
  const categories = [...new Set(data.tools.map((t) => t.category))].sort();
  const verbs = [...new Set(data.tools.map((t) => t.skeleton.verb))].sort();

  return NextResponse.json({
    success: true,
    data: paginatedTools,
    meta: {
      total: totalCount,
      limit,
      offset,
      hasMore: offset + limit < totalCount,
      categories,
      verbs,
    },
  });
}
