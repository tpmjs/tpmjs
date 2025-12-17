import { prisma } from '@tpmjs/db';
import { type NextRequest, NextResponse } from 'next/server';
import { convertJsonSchemaToParameters } from '~/lib/schema-extraction';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/tools/update-schema
 * Update a tool's input schema
 *
 * Called by the executor when it loads a tool and discovers its schema.
 * Looks up tool by packageName + exportName (unique constraint).
 * Stores the full JSON Schema and also converts to parameters array for backward compatibility.
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
        inputSchema: true,
        schemaSource: true,
      },
    });

    if (!tool) {
      console.log('[Update Schema] Tool not found:', { packageName, exportName });
      return NextResponse.json(
        { success: false, error: 'Tool not found', updated: false },
        { status: 404 }
      );
    }

    // Convert JSON Schema to parameters array for backward compatibility
    const parameters = convertJsonSchemaToParameters(inputSchema);

    // Check if schema already matches (avoid unnecessary updates)
    const existingSchema = tool.inputSchema as Record<string, unknown> | null;
    if (
      existingSchema &&
      tool.schemaSource === 'extracted' &&
      JSON.stringify(existingSchema) === JSON.stringify(inputSchema)
    ) {
      console.log('[Update Schema] Schema already up to date:', { packageName, exportName });
      return NextResponse.json({
        success: true,
        updated: false,
        message: 'Schema already up to date',
        schemaSource: tool.schemaSource,
      });
    }

    // Build update data
    const updateData: {
      // biome-ignore lint/suspicious/noExplicitAny: Prisma Json type compatibility workaround
      inputSchema: any;
      // biome-ignore lint/suspicious/noExplicitAny: Prisma Json type compatibility workaround
      parameters: any;
      schemaSource: string;
      schemaExtractedAt: Date;
      description?: string;
    } = {
      inputSchema,
      parameters,
      schemaSource: 'extracted',
      schemaExtractedAt: new Date(),
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
        inputSchema: true,
        schemaSource: true,
        schemaExtractedAt: true,
      },
    });

    console.log('[Update Schema] Tool updated:', {
      id: updatedTool.id,
      exportName: updatedTool.exportName,
      parameterCount: parameters.length,
      parameterNames: parameters.map((p) => p.name),
      schemaSource: updatedTool.schemaSource,
    });

    return NextResponse.json({
      success: true,
      updated: true,
      schemaSource: updatedTool.schemaSource,
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
