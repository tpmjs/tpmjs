import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const baseUrl = process.env.TPMJS_API_URL || 'https://tpmjs.com';
    const response = await fetch(`${baseUrl}/api/tools`);

    if (!response.ok) {
      throw new Error(`Failed to fetch tools: ${response.statusText}`);
    }

    const data = await response.json();

    // Transform web app response format to playground format
    // Web app returns { success, data: Tool[] }
    // Playground expects { success, tools: Tool[], total }
    const tools = data.data || [];
    return NextResponse.json({
      success: data.success,
      tools: tools.map((tool: any) => ({
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
      })),
      total: tools.length,
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
