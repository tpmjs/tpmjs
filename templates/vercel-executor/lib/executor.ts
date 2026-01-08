/**
 * TPMJS Executor - Core Execution Logic
 *
 * This module handles dynamic import and execution of TPMJS tools.
 * Tools are loaded from esm.sh and executed in a serverless environment.
 */

export interface ExecuteToolRequest {
  /** NPM package name, e.g., "@tpmjs/hello" */
  packageName: string;
  /** Tool name within the package, e.g., "helloWorld" */
  name: string;
  /** Package version, e.g., "1.0.0" or "latest" */
  version?: string;
  /** Direct esm.sh URL override for the package */
  importUrl?: string;
  /** Tool parameters to pass to execute() */
  params: Record<string, unknown>;
  /** Environment variables to inject during execution */
  env?: Record<string, string>;
}

export interface ExecuteToolResponse {
  /** Whether the execution succeeded */
  success: boolean;
  /** Tool output on success */
  output?: unknown;
  /** Error message on failure */
  error?: string;
  /** Execution duration in milliseconds */
  executionTimeMs: number;
}

/**
 * Build the esm.sh URL for a package
 */
function buildEsmUrl(packageName: string, version?: string): string {
  const resolvedVersion = version || 'latest';
  return `https://esm.sh/${packageName}@${resolvedVersion}`;
}

/**
 * Execute a TPMJS tool
 *
 * @param request - Execution request with package name, tool name, and parameters
 * @returns Execution result
 */
export async function executeTool(request: ExecuteToolRequest): Promise<ExecuteToolResponse> {
  const startTime = Date.now();

  try {
    // Build the import URL
    const importUrl = request.importUrl || buildEsmUrl(request.packageName, request.version);

    // Dynamically import the package from esm.sh
    const module = await import(/* webpackIgnore: true */ importUrl);

    // Get the tool export
    // Try the specific tool name first, then fall back to default export
    const tool = module[request.name] || module.default;

    if (!tool) {
      return {
        success: false,
        error: `Tool '${request.name}' not found in package '${request.packageName}'`,
        executionTimeMs: Date.now() - startTime,
      };
    }

    // Ensure the tool has an execute function
    if (typeof tool.execute !== 'function') {
      return {
        success: false,
        error: `Tool '${request.name}' does not have an execute() function`,
        executionTimeMs: Date.now() - startTime,
      };
    }

    // Inject environment variables if provided
    if (request.env) {
      for (const [key, value] of Object.entries(request.env)) {
        process.env[key] = value;
      }
    }

    // Execute the tool
    const output = await tool.execute(request.params);

    return {
      success: true,
      output,
      executionTimeMs: Date.now() - startTime,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      executionTimeMs: Date.now() - startTime,
    };
  }
}
