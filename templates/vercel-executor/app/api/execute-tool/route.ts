/**
 * Tool Execution Endpoint using Vercel Sandbox
 *
 * POST /api/execute-tool
 * Execute a TPMJS tool in an isolated Vercel Sandbox VM
 */

import { Sandbox } from '@vercel/sandbox';
import { type NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes max

interface ExecuteToolRequest {
  packageName: string;
  name: string;
  version?: string;
  params: Record<string, unknown>;
  env?: Record<string, string>;
}

interface ExecuteToolResponse {
  success: boolean;
  output?: unknown;
  error?: string;
  executionTimeMs: number;
}

export async function POST(req: NextRequest): Promise<NextResponse<ExecuteToolResponse>> {
  const startTime = Date.now();

  // Check authorization if EXECUTOR_API_KEY is set
  const apiKey = process.env.EXECUTOR_API_KEY;
  if (apiKey) {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || authHeader !== `Bearer ${apiKey}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', executionTimeMs: Date.now() - startTime },
        { status: 401 }
      );
    }
  }

  let sandbox: Sandbox | null = null;

  try {
    const body: ExecuteToolRequest = await req.json();
    const { packageName, name, version = 'latest', params, env } = body;

    if (!packageName || !name) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: packageName, name',
          executionTimeMs: Date.now() - startTime,
        },
        { status: 400 }
      );
    }

    const packageSpec = `${packageName}@${version}`;

    // Create sandbox with node22 runtime
    sandbox = await Sandbox.create({
      runtime: 'node22',
      timeout: 2 * 60 * 1000, // 2 minute timeout for the sandbox
    });

    // Install the npm package
    await sandbox.runCommand({
      cmd: 'npm',
      args: ['install', '--no-save', packageSpec],
      cwd: '/vercel/sandbox',
    });

    // Build environment setup code
    const envSetup = env
      ? Object.entries(env)
          .map(([key, value]) => `process.env[${JSON.stringify(key)}] = ${JSON.stringify(value)};`)
          .join('\n')
      : '';

    // Create the execution script
    const script = `
${envSetup}

const pkg = require('${packageName}');

// Get the tool export
let tool = pkg['${name}'] || pkg.default?.['${name}'] || pkg.default;

if (!tool) {
  console.log(JSON.stringify({ __tpmjs_error__: 'Tool "${name}" not found in package "${packageName}"' }));
  process.exit(1);
}

// Handle factory functions (tools that need to be called to create the tool instance)
async function resolveFactory(rawTool, envVars) {
  if (typeof rawTool !== 'function' || rawTool.execute) {
    return rawTool;
  }

  // Strategy 1: Try calling with no arguments
  try {
    const result = rawTool();
    if (result && typeof result.execute === 'function') {
      return result;
    }
  } catch {}

  // Strategy 2: Try with env config object
  if (envVars) {
    const configVariations = [
      envVars,
      // Extract API key if present
      (() => {
        const entry = Object.entries(envVars).find(([k]) => k.toUpperCase().includes('API_KEY'));
        return entry ? { apiKey: entry[1] } : null;
      })(),
    ].filter(Boolean);

    for (const config of configVariations) {
      try {
        const result = rawTool(config);
        if (result && typeof result.execute === 'function') {
          return result;
        }
      } catch {}
    }
  }

  return rawTool;
}

(async () => {
  try {
    const envVars = ${env ? JSON.stringify(env) : 'null'};
    const resolvedTool = await resolveFactory(tool, envVars);

    if (!resolvedTool || typeof resolvedTool.execute !== 'function') {
      console.log(JSON.stringify({ __tpmjs_error__: 'Tool "${name}" does not have an execute() function' }));
      process.exit(1);
    }

    const params = ${JSON.stringify(params)};
    const result = await resolvedTool.execute(params);

    console.log(JSON.stringify({ __tpmjs_result__: result }));
  } catch (err) {
    console.log(JSON.stringify({ __tpmjs_error__: err.message || String(err) }));
    process.exit(1);
  }
})();
`;

    // Write the script to a file
    await sandbox.writeFiles([
      { path: '/vercel/sandbox/execute.cjs', content: Buffer.from(script) },
    ]);

    // Run the script and capture output
    let stdout = '';
    let stderr = '';

    await sandbox.runCommand({
      cmd: 'node',
      args: ['execute.cjs'],
      cwd: '/vercel/sandbox',
      stdout: {
        write(chunk: Buffer | string) {
          stdout += chunk.toString();
          return true;
        },
      } as NodeJS.WritableStream,
      stderr: {
        write(chunk: Buffer | string) {
          stderr += chunk.toString();
          return true;
        },
      } as NodeJS.WritableStream,
    });

    // Parse the output to extract the result
    const lines = stdout.split('\n');
    for (const line of lines) {
      if (line.includes('__tpmjs_result__')) {
        try {
          const parsed = JSON.parse(line);
          return NextResponse.json({
            success: true,
            output: parsed.__tpmjs_result__,
            executionTimeMs: Date.now() - startTime,
          });
        } catch {
          // Continue searching
        }
      }
      if (line.includes('__tpmjs_error__')) {
        try {
          const parsed = JSON.parse(line);
          return NextResponse.json({
            success: false,
            error: parsed.__tpmjs_error__,
            executionTimeMs: Date.now() - startTime,
          });
        } catch {
          // Continue searching
        }
      }
    }

    // If we couldn't find structured output, check stderr
    if (stderr) {
      return NextResponse.json({
        success: false,
        error: stderr.trim(),
        executionTimeMs: Date.now() - startTime,
      });
    }

    // Return raw stdout if no structured result
    return NextResponse.json({
      success: true,
      output: stdout.trim() || null,
      executionTimeMs: Date.now() - startTime,
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      executionTimeMs: Date.now() - startTime,
    });
  } finally {
    // Always stop the sandbox
    if (sandbox) {
      try {
        await sandbox.stop();
      } catch {
        // Ignore cleanup errors
      }
    }
  }
}

// Handle OPTIONS for CORS preflight
export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
