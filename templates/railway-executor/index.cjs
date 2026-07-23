#!/usr/bin/env node
/**
 * TPMJS Executor for Railway
 *
 * A lightweight HTTP server that executes TPMJS tools.
 * Designed for deployment on Railway with zero dependencies.
 *
 * API-compatible with TPMJS custom executors.
 */

const http = require('node:http');
const { execSync, spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.EXECUTOR_API_KEY || null;

// Protocol constants
const PROTOCOL_VERSION = '1.0';
const IMPLEMENTATION_VERSION = '1.0.0';

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-TPMJS-Protocol-Version',
};

/**
 * Send JSON response with proper headers
 */
function jsonResponse(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    ...corsHeaders,
  });
  res.end(JSON.stringify(data));
}

/**
 * Validate API key if configured
 */
function checkAuth(req) {
  if (!API_KEY) return true;
  const authHeader = req.headers.authorization;
  return authHeader === `Bearer ${API_KEY}`;
}

/**
 * Parse JSON request body
 */
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (_e) {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

/**
 * GET /health - Health check endpoint
 */
function handleHealth(_req, res) {
  jsonResponse(res, 200, {
    status: 'ok',
    protocolVersion: PROTOCOL_VERSION,
    implementationVersion: IMPLEMENTATION_VERSION,
    runtime: 'node',
    timestamp: new Date().toISOString(),
  });
}

/**
 * GET /info - Capability advertisement endpoint
 */
function handleInfo(_req, res) {
  jsonResponse(res, 200, {
    name: 'Railway Executor',
    version: IMPLEMENTATION_VERSION,
    protocolVersion: PROTOCOL_VERSION,
    capabilities: {
      isolation: 'process',
      executionModes: ['sync'],
      maxExecutionTimeMs: 120000,
      maxRequestBodyBytes: 10485760,
      supportsStreaming: false,
      supportsCallbacks: false,
      supportsCaching: false,
    },
    runtime: {
      platform: process.platform,
      nodeVersion: process.version,
      region: process.env.RAILWAY_REGION || undefined,
    },
  });
}

/**
 * Create isolated work directory and package.json
 */
function createWorkDir() {
  const workDir = `/tmp/tpmjs-exec-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  fs.mkdirSync(workDir, { recursive: true });
  fs.writeFileSync(
    path.join(workDir, 'package.json'),
    JSON.stringify({
      name: 'tpmjs-execution',
      private: true,
      type: 'commonjs',
    })
  );
  return workDir;
}

/**
 * Install npm package in work directory
 */
function installPackage(workDir, packageSpec) {
  execSync(`npm install --no-save --omit=dev --no-audit --no-fund ${packageSpec}`, {
    cwd: workDir,
    stdio: ['pipe', 'pipe', 'pipe'],
    timeout: 60000, // 60s timeout for install
  });
}

/**
 * Generate the tool execution script
 */
function generateExecutionScript(packageName, name, params, env) {
  const envSetup = env
    ? Object.entries(env)
        .map(([key, value]) => `process.env[${JSON.stringify(key)}] = ${JSON.stringify(value)};`)
        .join('\n')
    : '';

  return `
${envSetup}

(async () => {
  try {
    const pkg = require(${JSON.stringify(packageName)});

    // Find the tool export - check named export, default.name, or default
    let tool = pkg[${JSON.stringify(name)}] || pkg.default?.[${JSON.stringify(name)}] || pkg.default;

    if (!tool) {
      throw new Error(\`Tool "${name}" not found in package "${packageName}"\`);
    }

    // Handle factory functions (tools that need to be instantiated)
    if (typeof tool === 'function' && !tool.execute) {
      const envVars = ${env ? JSON.stringify(env) : 'null'};

      // Try no-arg call first
      try {
        const result = tool();
        if (result && typeof result.execute === 'function') {
          tool = result;
        }
      } catch {}

      // Try with env config if still a function
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
      throw new Error(\`Tool "${name}" does not have an execute() function\`);
    }

    // Execute the tool
    const result = await tool.execute(${JSON.stringify(params)});
    process.stdout.write(JSON.stringify({ __tpmjs_result__: result }));
  } catch (err) {
    process.stderr.write(JSON.stringify({ __tpmjs_error__: err.message || String(err) }));
    process.exitCode = 1;
  }
})();
`.trim();
}

/**
 * Run execution script and return results
 */
function runScript(workDir, env) {
  return new Promise((resolve) => {
    const child = spawn('node', ['execute.cjs'], {
      cwd: workDir,
      env: { ...process.env, ...env },
      timeout: 120000, // 2 minute timeout
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data;
    });
    child.stderr.on('data', (data) => {
      stderr += data;
    });

    child.on('close', (code) => {
      resolve({ exitCode: code, stdout, stderr });
    });

    child.on('error', (err) => {
      resolve({ exitCode: 1, stdout: '', stderr: err.message });
    });
  });
}

/**
 * Clean up work directory
 */
function cleanup(workDir) {
  try {
    fs.rmSync(workDir, { recursive: true, force: true });
  } catch (_e) {
    // Ignore cleanup errors
  }
}

/**
 * Parse execution result and determine response
 */
function parseExecutionResult(result, startTime) {
  // Handle execution failure
  if (result.exitCode !== 0) {
    // Try to parse structured error from stderr
    try {
      const errorObj = JSON.parse(result.stderr);
      if (errorObj.__tpmjs_error__) {
        const errorMessage = errorObj.__tpmjs_error__;
        // Determine error code based on message
        let code = 'TOOL_EXECUTION_ERROR';
        if (errorMessage.includes('not found in package')) {
          code = 'TOOL_NOT_FOUND';
        } else if (errorMessage.includes('does not have an execute()')) {
          code = 'TOOL_INVALID';
        }
        return {
          success: false,
          error: {
            code,
            message: errorMessage,
          },
          executionTimeMs: Date.now() - startTime,
        };
      }
    } catch (_e) {
      // Not structured error
    }

    return {
      success: false,
      error: {
        code: 'TOOL_EXECUTION_ERROR',
        message: result.stderr || `Script exited with code ${result.exitCode}`,
      },
      executionTimeMs: Date.now() - startTime,
    };
  }

  // Parse the result
  try {
    const parsed = JSON.parse(result.stdout);
    if (parsed.__tpmjs_result__ !== undefined) {
      return {
        success: true,
        output: parsed.__tpmjs_result__,
        executionTimeMs: Date.now() - startTime,
      };
    }
  } catch (_e) {
    // Not structured result
  }

  // Return raw output
  return {
    success: true,
    output: result.stdout || null,
    executionTimeMs: Date.now() - startTime,
  };
}

/**
 * POST /execute-tool - Execute a TPMJS tool
 */
async function handleExecuteTool(req, res) {
  const startTime = Date.now();

  // Check authorization
  if (!checkAuth(req)) {
    return jsonResponse(res, 401, {
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid or missing API key',
      },
    });
  }

  // Parse request body
  let body;
  try {
    body = await parseBody(req);
  } catch (_e) {
    return jsonResponse(res, 400, {
      success: false,
      error: {
        code: 'INVALID_REQUEST',
        message: 'Invalid JSON body',
      },
    });
  }

  const { packageName, name, version = 'latest', params = {}, env } = body;

  // Validate required fields
  if (!packageName || !name) {
    return jsonResponse(res, 400, {
      success: false,
      error: {
        code: 'INVALID_REQUEST',
        message: 'Missing required fields: packageName, name',
      },
    });
  }

  const packageSpec = `${packageName}@${version}`;
  const workDir = createWorkDir();

  try {
    // Install the npm package
    console.log(`[executor] Installing ${packageSpec}...`);
    const installStart = Date.now();

    try {
      installPackage(workDir, packageSpec);
    } catch (installError) {
      console.error(`[executor] npm install failed:`, installError.message);
      cleanup(workDir);
      return jsonResponse(res, 200, {
        success: false,
        error: {
          code: 'PACKAGE_NOT_FOUND',
          message: `npm install failed for ${packageSpec}: ${installError.message}`,
        },
        executionTimeMs: Date.now() - startTime,
      });
    }

    console.log(`[executor] npm install completed in ${Date.now() - installStart}ms`);

    // Generate and write execution script
    const script = generateExecutionScript(packageName, name, params, env);
    fs.writeFileSync(path.join(workDir, 'execute.cjs'), script);

    // Run the execution script
    console.log(`[executor] Running tool ${packageName}/${name}...`);
    const runStart = Date.now();
    const result = await runScript(workDir, env);
    console.log(
      `[executor] Tool execution completed in ${Date.now() - runStart}ms (exit: ${result.exitCode})`
    );

    // Cleanup and return result
    cleanup(workDir);
    return jsonResponse(res, 200, parseExecutionResult(result, startTime));
  } catch (error) {
    cleanup(workDir);
    return jsonResponse(res, 200, {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || String(error),
      },
      executionTimeMs: Date.now() - startTime,
    });
  }
}

/**
 * Main HTTP server
 */
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = url.pathname;

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(200, corsHeaders);
    return res.end();
  }

  // Route requests (support both /api/path and /path)
  if ((pathname === '/api/health' || pathname === '/health') && req.method === 'GET') {
    return handleHealth(req, res);
  }

  if ((pathname === '/api/info' || pathname === '/info') && req.method === 'GET') {
    return handleInfo(req, res);
  }

  if ((pathname === '/api/execute-tool' || pathname === '/execute-tool') && req.method === 'POST') {
    return handleExecuteTool(req, res);
  }

  // Root path - simple info
  if (pathname === '/' && req.method === 'GET') {
    return jsonResponse(res, 200, {
      name: 'TPMJS Railway Executor',
      version: IMPLEMENTATION_VERSION,
      protocolVersion: PROTOCOL_VERSION,
      endpoints: {
        health: 'GET /health',
        info: 'GET /info',
        execute: 'POST /execute-tool',
      },
    });
  }

  // 404 for unknown routes
  jsonResponse(res, 404, { error: 'Not found' });
});

// Start server
server.listen(PORT, () => {
  console.log(`TPMJS Executor running on port ${PORT}`);
  console.log(`Health: http://localhost:${PORT}/health`);
  console.log(`Execute: POST http://localhost:${PORT}/execute-tool`);
  if (API_KEY) {
    console.log(`Authentication: Required (EXECUTOR_API_KEY is set)`);
  } else {
    console.log(`Authentication: None (set EXECUTOR_API_KEY to enable)`);
  }
});
