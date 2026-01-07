import { prisma } from '@tpmjs/db';
import { type NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '~/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

/**
 * Convert JSON Schema to a simplified parameters array format
 * Useful for clients that want a flat list of parameter definitions
 */
function extractParametersFromSchema(inputSchema: unknown): Array<{
  name: string;
  type: string;
  description?: string;
  required: boolean;
  default?: unknown;
  enum?: unknown[];
}> {
  if (!inputSchema || typeof inputSchema !== 'object') {
    return [];
  }

  const schema = inputSchema as Record<string, unknown>;
  const properties = schema.properties as Record<string, Record<string, unknown>> | undefined;
  const required = (schema.required as string[]) || [];

  if (!properties) {
    return [];
  }

  return Object.entries(properties).map(([name, prop]) => ({
    name,
    type: (prop.type as string) || 'unknown',
    description: prop.description as string | undefined,
    required: required.includes(name),
    default: prop.default,
    enum: prop.enum as unknown[] | undefined,
  }));
}

/**
 * GET /api/tools/parameters
 *
 * Fetch tool parameters by package name and tool name
 *
 * Query params:
 * - packageName: npm package name (required)
 * - name: tool/export name (required)
 * - format: 'schema' | 'parameters' (default: 'parameters')
 *
 * Examples:
 * - /api/tools/parameters?packageName=@tpmjs/hello&name=hello
 * - /api/tools/parameters?packageName=my-package&name=myTool&format=schema
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  // Check rate limit
  const rateLimitResponse = checkRateLimit(request);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const { searchParams } = new URL(request.url);
    const packageName = searchParams.get('packageName');
    const name = searchParams.get('name');
    const format = searchParams.get('format') || 'parameters';

    if (!packageName || !name) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required parameters',
          message: 'Both packageName and name query parameters are required',
        },
        { status: 400 }
      );
    }

    // Find the tool
    const tool = await prisma.tool.findFirst({
      where: {
        name,
        package: {
          npmPackageName: packageName,
        },
      },
      select: {
        id: true,
        name: true,
        description: true,
        inputSchema: true,
        parameters: true,
        schemaSource: true,
        schemaExtractedAt: true,
        package: {
          select: {
            npmPackageName: true,
            npmVersion: true,
          },
        },
      },
    });

    if (!tool) {
      return NextResponse.json(
        {
          success: false,
          error: 'Tool not found',
        },
        { status: 404 }
      );
    }

    // Determine what parameters to return
    let parameters: unknown;
    let source: string;

    if (format === 'schema') {
      // Return raw JSON Schema
      parameters = tool.inputSchema || null;
      source = tool.inputSchema ? 'inputSchema' : 'none';
    } else {
      // Return simplified parameters array
      if (tool.inputSchema) {
        // Prefer extracting from inputSchema if available
        parameters = extractParametersFromSchema(tool.inputSchema);
        source = 'inputSchema';
      } else if (tool.parameters) {
        // Fallback to author-provided parameters
        parameters = tool.parameters;
        source = 'author';
      } else {
        // No parameters available
        parameters = [];
        source = 'none';
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        packageName: tool.package.npmPackageName,
        name: tool.name,
        description: tool.description,
        version: tool.package.npmVersion,
        parameters,
        source,
        schemaExtractedAt: tool.schemaExtractedAt,
      },
    });
  } catch (error) {
    console.error('Error fetching tool parameters:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch tool parameters',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
