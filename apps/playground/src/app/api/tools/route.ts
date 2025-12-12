import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface RawTool {
  id: string;
  exportName: string;
  description: string;
  qualityScore: number;
  importHealth: 'HEALTHY' | 'BROKEN' | 'UNKNOWN';
  executionHealth: 'HEALTHY' | 'BROKEN' | 'UNKNOWN';
  healthCheckError: string | null;
  lastHealthCheck: string | null;
  package?: {
    npmPackageName: string;
    npmVersion: string;
    category: string;
    frameworks: string[];
    env: Array<{ name: string; description: string; required?: boolean; default?: string }>;
  };
}

function transformTool(tool: RawTool) {
  return {
    toolId: tool.id,
    packageName: tool.package?.npmPackageName,
    exportName: tool.exportName,
    description: tool.description,
    category: tool.package?.category,
    version: tool.package?.npmVersion,
    qualityScore: tool.qualityScore,
    frameworks: tool.package?.frameworks,
    env: tool.package?.env,
    importUrl: `https://esm.sh/${tool.package?.npmPackageName}@${tool.package?.npmVersion}`,
    importHealth: tool.importHealth,
    executionHealth: tool.executionHealth,
    healthCheckError: tool.healthCheckError,
    lastHealthCheck: tool.lastHealthCheck,
  };
}

export async function GET() {
  try {
    const baseUrl = process.env.TPMJS_API_URL || 'https://tpmjs.com';
    const allTools: RawTool[] = [];
    let offset = 0;
    const limit = 50; // Max allowed by the API
    let hasMore = true;

    // Paginate through all tools
    while (hasMore) {
      const response = await fetch(`${baseUrl}/api/tools?limit=${limit}&offset=${offset}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch tools: ${response.statusText}`);
      }

      const data = await response.json();
      const tools = data.data || [];
      allTools.push(...tools);

      hasMore = data.pagination?.hasMore ?? false;
      offset += limit;

      // Safety limit to prevent infinite loops
      if (offset > 1000) break;
    }

    return NextResponse.json({
      success: true,
      tools: allTools.map(transformTool),
      total: allTools.length,
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
