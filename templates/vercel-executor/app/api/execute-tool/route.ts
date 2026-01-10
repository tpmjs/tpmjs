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
  stderr?: string;
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
    const cwd = '/vercel/sandbox';

    // Create sandbox with node22 runtime
    sandbox = await Sandbox.create({
      runtime: 'node22',
      timeout: 2 * 60 * 1000, // 2 minute timeout
      resources: { vcpus: 2 },
    });

    // 1) Install the npm package
    console.log(`[executor] Installing ${packageSpec}...`);
    const installStart = Date.now();

    const install = await sandbox.runCommand({
      cmd: 'npm',
      args: ['install', '--no-save', '--omit=dev', '--no-audit', '--no-fund', packageSpec],
      cwd,
    });

    const installStderr = await install.stderr();
    const installStdout = await install.stdout();
    const installTime = Date.now() - installStart;

    console.log(`[executor] npm install completed in ${installTime}ms (exit: ${install.exitCode})`);

    if (install.exitCode !== 0) {
      console.error(`[executor] npm install failed:`, {
        exitCode: install.exitCode,
        stdout: installStdout?.slice(0, 500),
        stderr: installStderr?.slice(0, 500),
      });
      return NextResponse.json({
        success: false,
        error: `npm install failed with exit code ${install.exitCode}`,
        stderr: installStderr || installStdout,
        executionTimeMs: Date.now() - startTime,
      });
    }

    // 2) Build environment setup for the script
    const envSetup = env
      ? Object.entries(env)
          .map(([key, value]) => `process.env[${JSON.stringify(key)}] = ${JSON.stringify(value)};`)
          .join('\n')
      : '';

    // 3) Write the execution script (CommonJS for require())
    const script = `
${envSetup}

(async () => {
  try {
    const pkg = require(${JSON.stringify(packageName)});

    // Get the tool export
    let tool = pkg[${JSON.stringify(name)}] || pkg.default?.[${JSON.stringify(name)}] || pkg.default;

    if (!tool) {
      throw new Error('Tool "${name}" not found in package "${packageName}"');
    }

    // Handle factory functions
    if (typeof tool === 'function' && !tool.execute) {
      const envVars = ${env ? JSON.stringify(env) : 'null'};

      // Try no-arg call first
      try {
        const result = tool();
        if (result && typeof result.execute === 'function') {
          tool = result;
        }
      } catch {}

      // Try with env config
      if (typeof tool === 'function' && envVars) {
        try {
          const result = tool(envVars);
          if (result && typeof result.execute === 'function') {
            tool = result;
          }
        } catch {}
      }
    }

    if (!tool || typeof tool.execute !== 'function') {
      throw new Error('Tool "${name}" does not have an execute() function');
    }

    const result = await tool.execute(${JSON.stringify(params)});
    process.stdout.write(JSON.stringify({ __tpmjs_result__: result }));
  } catch (err) {
    process.stderr.write(JSON.stringify({ __tpmjs_error__: err.message || String(err) }));
    process.exitCode = 1;
  }
})();
`.trim();

    await sandbox.writeFiles([{ path: 'execute.cjs', content: Buffer.from(script, 'utf8') }]);

    // 4) Run the script
    console.log(`[executor] Running tool ${packageName}/${name}...`);
    const runStart = Date.now();

    const run = await sandbox.runCommand({
      cmd: 'node',
      args: ['execute.cjs'],
      cwd,
      env: env || {},
    });

    const stdout = await run.stdout();
    const stderr = await run.stderr();
    const runTime = Date.now() - runStart;

    console.log(`[executor] Tool execution completed in ${runTime}ms (exit: ${run.exitCode})`);

    if (run.exitCode !== 0) {
      console.error(`[executor] Tool execution failed:`, {
        exitCode: run.exitCode,
        stdout: stdout?.slice(0, 500),
        stderr: stderr?.slice(0, 500),
      });

      // Try to parse error from stderr
      try {
        const errorObj = JSON.parse(stderr);
        if (errorObj.__tpmjs_error__) {
          return NextResponse.json({
            success: false,
            error: errorObj.__tpmjs_error__,
            executionTimeMs: Date.now() - startTime,
          });
        }
      } catch {}

      return NextResponse.json({
        success: false,
        error: stderr || `Script exited with code ${run.exitCode}`,
        executionTimeMs: Date.now() - startTime,
      });
    }

    // 5) Parse the result
    try {
      const parsed = JSON.parse(stdout);
      if (parsed.__tpmjs_result__ !== undefined) {
        return NextResponse.json({
          success: true,
          output: parsed.__tpmjs_result__,
          executionTimeMs: Date.now() - startTime,
        });
      }
    } catch {}

    // If we couldn't parse structured output, return raw
    return NextResponse.json({
      success: true,
      output: stdout || null,
      stderr: stderr || undefined,
      executionTimeMs: Date.now() - startTime,
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      executionTimeMs: Date.now() - startTime,
    });
  } finally {
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
