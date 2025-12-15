import { prisma } from '@tpmjs/db';
import { type NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/tools/update-schema
 * Update a tool's input schema (parameters field)
 *
 * This is called when a tool is executed and we discover its actual schema
 * from the executor's /load-and-describe endpoint.
 *
 * Body:
 * - toolId: The tool's database ID
 * - inputSchema: The JSON Schema for the tool's input parameters
 * - description: Optional updated description from the tool
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { toolId, inputSchema, description } = body;

    if (!toolId) {
      return NextResponse.json({ success: false, error: 'toolId is required' }, { status: 400 });
    }

    if (!inputSchema) {
      return NextResponse.json(
        { success: false, error: 'inputSchema is required' },
        { status: 400 }
      );
    }

    console.log('[Update Schema] Updating tool:', toolId);
    console.log('[Update Schema] Schema properties:', Object.keys(inputSchema.properties || {}));

    // Convert JSON Schema to our parameters format
    // The parameters field stores an array of parameter objects
    const parameters = [];
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

    // Update the tool in the database
    const updateData: { parameters: typeof parameters; description?: string } = {
      parameters,
    };

    // Only update description if provided and different
    if (description) {
      updateData.description = description;
    }

    const updatedTool = await prisma.tool.update({
      where: { id: toolId },
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
    });

    return NextResponse.json({
      success: true,
      tool: updatedTool,
    });
  } catch (error) {
    console.error('[Update Schema] Error:', error);

    // Handle not found error
    if (error instanceof Error && error.message.includes('Record to update not found')) {
      return NextResponse.json({ success: false, error: 'Tool not found' }, { status: 404 });
    }

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
