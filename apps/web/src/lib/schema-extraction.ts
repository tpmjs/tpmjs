/**
 * Schema Extraction Service
 * Extracts inputSchema from tools via the Railway executor's /load-and-describe endpoint
 */

import { env } from '~/env';

const RAILWAY_EXECUTOR_URL = env.RAILWAY_EXECUTOR_URL;

/**
 * Result from listing exports
 */
export interface ListExportsSuccess {
  success: true;
  packageName: string;
  version: string;
  exports: string[];
  tools: Array<{
    name: string;
    isValidTool: boolean;
    description?: string;
    error?: string;
  }>;
}

export interface ListExportsFailure {
  success: false;
  error: string;
}

export type ListExportsResult = ListExportsSuccess | ListExportsFailure;

/**
 * List all exports from a package and identify valid tools
 * Calls the executor's /list-exports endpoint
 *
 * @param packageName - NPM package name
 * @param version - Package version
 * @param packageEnv - Package-level environment variables (optional)
 * @returns List of exports with tool validation info
 */
export async function listToolExports(
  packageName: string,
  version: string,
  packageEnv?: Record<string, unknown> | null
): Promise<ListExportsResult> {
  try {
    const response = await fetch(`${RAILWAY_EXECUTOR_URL}/list-exports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        packageName,
        version,
        env: packageEnv || {},
      }),
      signal: AbortSignal.timeout(15000), // 15 second timeout
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      return { success: false, error: `HTTP ${response.status}: ${errorText || 'Request failed'}` };
    }

    const data = await response.json();

    if (!data.success) {
      return { success: false, error: data.error || 'Failed to list exports' };
    }

    return {
      success: true,
      packageName: data.packageName,
      version: data.version,
      exports: data.exports,
      tools: data.tools,
    };
  } catch (error) {
    // Handle timeout specifically
    if (error instanceof Error && error.name === 'TimeoutError') {
      return {
        success: false,
        error: 'Listing exports timed out after 15 seconds',
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error listing exports',
    };
  }
}

export interface SchemaExtractionSuccess {
  success: true;
  inputSchema: Record<string, unknown>;
  description?: string;
}

export interface SchemaExtractionFailure {
  success: false;
  error: string;
}

export type SchemaExtractionResult = SchemaExtractionSuccess | SchemaExtractionFailure;

/**
 * Extract inputSchema from a tool by calling the executor's /load-and-describe endpoint
 *
 * @param packageName - NPM package name (e.g., "@tpmjs/hello-world")
 * @param name - Export name (e.g., "helloWorldTool" or "default")
 * @param version - Package version (e.g., "1.0.0")
 * @param packageEnv - Package-level environment variables (optional)
 * @returns Schema extraction result with inputSchema or error
 */
export async function extractToolSchema(
  packageName: string,
  name: string,
  version: string,
  packageEnv?: Record<string, unknown> | null
): Promise<SchemaExtractionResult> {
  try {
    const response = await fetch(`${RAILWAY_EXECUTOR_URL}/load-and-describe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        packageName,
        name,
        version,
        env: packageEnv || {},
      }),
      signal: AbortSignal.timeout(10000), // 10 second timeout per extraction
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      return {
        success: false,
        error: `HTTP ${response.status}: ${errorText || 'Request failed'}`,
      };
    }

    const data = await response.json();

    if (!data.success) {
      return {
        success: false,
        error: data.error || 'Extraction failed without error message',
      };
    }

    if (!data.tool?.inputSchema) {
      return {
        success: false,
        error: 'No inputSchema returned from executor',
      };
    }

    return {
      success: true,
      inputSchema: data.tool.inputSchema,
      description: data.tool.description,
    };
  } catch (error) {
    // Handle timeout specifically
    if (error instanceof Error && error.name === 'TimeoutError') {
      return {
        success: false,
        error: 'Schema extraction timed out after 10 seconds',
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during extraction',
    };
  }
}

/**
 * Convert JSON Schema to parameters array format (for backward compatibility)
 *
 * @param inputSchema - JSON Schema object from executor
 * @returns Array of parameter objects in legacy format
 */
export function convertJsonSchemaToParameters(inputSchema: Record<string, unknown>): Array<{
  name: string;
  type: string;
  required: boolean;
  description: string;
}> {
  const parameters: Array<{
    name: string;
    type: string;
    required: boolean;
    description: string;
  }> = [];

  const properties = inputSchema.properties as
    | Record<string, { type?: string; description?: string }>
    | undefined;
  const required = (inputSchema.required as string[]) || [];

  if (properties) {
    for (const [name, prop] of Object.entries(properties)) {
      parameters.push({
        name,
        type: prop.type || 'string',
        required: required.includes(name),
        description: prop.description || '',
      });
    }
  }

  return parameters;
}
