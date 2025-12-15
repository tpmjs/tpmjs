import { prisma } from '@tpmjs/db';
import { type NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/tools/update-schema
 * Update a tool's input schema (parameters field)
 *
 * Called by the executor when it loads a tool and discovers its schema.
 * Looks up tool by packageName + exportName (unique constraint).
 *
 * Body:
 * - packageName: npm package name
 * - exportName: exported function name
 * - inputSchema: The JSON Schema for the tool's input parameters
 * - description: Optional updated description from the tool
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { packageName, exportName, inputSchema, description } = body;

    if (!packageName || !exportName) {
      return NextResponse.json(
        { success: false, error: 'packageName and exportName are required' },
        { status: 400 }
      );
    }

    if (!inputSchema) {
      return NextResponse.json(
        { success: false, error: 'inputSchema is required' },
        { status: 400 }
      );
    }

    console.log('[Update Schema] Looking up tool:', { packageName, exportName });

    // Find the tool by package name and export name
    const tool = await prisma.tool.findFirst({
      where: {
        exportName,
        package: {
          npmPackageName: packageName,
        },
      },
      select: {
        id: true,
        parameters: true,
      },
    });

    if (!tool) {
      console.log('[Update Schema] Tool not found:', { packageName, exportName });
      return NextResponse.json(
        { success: false, error: 'Tool not found', updated: false },
        { status: 404 }
      );
    }

    // Convert JSON Schema to our parameters format
    const parameters: Array<{
      name: string;
      type: string;
      required: boolean;
      description: string;
    }> = [];
    if (inputSchema.properties) {
      for (const [name, prop] of Object.entries(inputSchema.properties)) {
        const propDef = prop as { type?: string; description?: string };
        parameters.push({
          name,
          type: propDef.type || 'string',
          required: inputSchema.required?.includes(name) || false,
          description: propDef.description || '',
        });
      }
    }

    // Check if parameters already match (avoid unnecessary updates)
    const existingParams = tool.parameters as Array<{ name: string }> | null;
    const existingParamNames =
      existingParams
        ?.map((p) => p.name)
        .sort()
        .join(',') || '';
    const newParamNames = parameters
      .map((p) => p.name)
      .sort()
      .join(',');

    if (existingParamNames === newParamNames && parameters.length > 0) {
      console.log('[Update Schema] Schema already up to date:', { packageName, exportName });
      return NextResponse.json({
        success: true,
        updated: false,
        message: 'Schema already up to date',
      });
    }

    // Update the tool
    const updateData: { parameters: typeof parameters; description?: string } = {
      parameters,
    };

    if (description) {
      updateData.description = description;
    }

    const updatedTool = await prisma.tool.update({
      where: { id: tool.id },
      data: updateData,
      select: {
        id: true,
        exportName: true,
        description: true,
        parameters: true,
      },
    });

    console.log('[Update Schema] Tool updated:', {
      id: updatedTool.id,
      exportName: updatedTool.exportName,
      parameterCount: parameters.length,
      parameterNames: parameters.map((p) => p.name),
    });

    return NextResponse.json({
      success: true,
      updated: true,
      tool: updatedTool,
    });
  } catch (error) {
    console.error('[Update Schema] Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update tool schema',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
