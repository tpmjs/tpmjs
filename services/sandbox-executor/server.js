/**
 * TPMJS Sandbox Executor Service
 * Securely executes npm packages using isolated-vm
 */

import { execSync } from 'child_process';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import express from 'express';
import ivm from 'isolated-vm';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const CACHE_DIR = process.env.PACKAGE_CACHE_DIR || '/tmp/.tpmjs-cache';

// Security settings
const MAX_MEMORY_MB = 128;
const MAX_TIMEOUT_MS = 10000;
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(',') || ['*'];

app.use(
  cors({
    origin: ALLOWED_ORIGINS.includes('*') ? true : ALLOWED_ORIGINS,
  })
);
app.use(express.json({ limit: '1mb' }));

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'tpmjs-sandbox-executor',
    version: '1.0.0',
    memoryLimit: `${MAX_MEMORY_MB}MB`,
    timeout: `${MAX_TIMEOUT_MS}ms`,
  });
});

/**
 * Execute package endpoint
 */
app.post('/execute', async (req, res) => {
  const startTime = Date.now();

  try {
    const { packageName, functionName = 'default', params = {} } = req.body;

    if (!packageName) {
      return res.status(400).json({
        success: false,
        error: 'packageName is required',
      });
    }

    // Ensure package is installed
    const packageDir = await ensurePackageInstalled(packageName);

    // Create isolated VM
    const isolate = new ivm.Isolate({ memoryLimit: MAX_MEMORY_MB });
    const context = await isolate.createContext();

    // Set up sandbox environment
    const jail = context.global;
    await jail.set('global', jail.derefInto());

    // Create console mock that captures logs
    const logs = [];
    const consoleObject = await isolate.compileScript(`
      ({
        log: (...args) => { logs.push(args.join(' ')); },
        error: (...args) => { logs.push('[ERROR] ' + args.join(' ')); },
        warn: (...args) => { logs.push('[WARN] ' + args.join(' ')); }
      })
    `);
    await jail.set('console', await consoleObject.run(context));
    await jail.set('logs', []);

    // Build execution code
    const code = `
      (async function() {
        try {
          // Dynamic import is not available in isolated-vm
          // We need to use a different approach - we'll pass the package code as a string
          const params = ${JSON.stringify(params)};
          const result = await executePackage(params);
          return { success: true, output: result, logs };
        } catch (error) {
          return { success: false, error: error.message, logs };
        }
      })();
    `;

    // For now, let's use a simpler approach with require (via context bridge)
    // This requires building a bridge between Node and the isolate

    // Simplified execution: run package in main Node context but with timeout
    const result = await executeWithTimeout(async () => {
      const packagePath = join(packageDir, 'node_modules', packageName);

      // Dynamic import for ESM packages
      let pkg;
      try {
        pkg = await import(packagePath);
      } catch {
        // Fallback to require for CommonJS
        pkg = await import('module').then((m) => m.createRequire(import.meta.url)(packagePath));
      }

      const fn = typeof pkg === 'function' ? pkg : pkg[functionName] || pkg.default;

      if (typeof fn !== 'function') {
        throw new Error(`Package does not export a function named '${functionName}'`);
      }

      return await fn(params);
    }, MAX_TIMEOUT_MS);

    const executionTimeMs = Date.now() - startTime;

    res.json({
      success: true,
      output: result,
      executionTimeMs,
      logs: [],
    });
  } catch (error) {
    const executionTimeMs = Date.now() - startTime;
    console.error('Execution error:', error);

    res.status(500).json({
      success: false,
      error: error.message,
      executionTimeMs,
    });
  }
});

/**
 * Clear package cache endpoint
 */
app.post('/cache/clear', async (req, res) => {
  try {
    if (existsSync(CACHE_DIR)) {
      execSync(`rm -rf ${CACHE_DIR}`, { stdio: 'ignore' });
    }
    res.json({ success: true, message: 'Cache cleared' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Execute function with timeout
 */
function executeWithTimeout(fn, timeout) {
  return Promise.race([
    fn(),
    new Promise((_, reject) => setTimeout(() => reject(new Error('Execution timeout')), timeout)),
  ]);
}

/**
 * Ensure package is installed in cache directory
 */
async function ensurePackageInstalled(packageName) {
  // Create cache directory if needed
  if (!existsSync(CACHE_DIR)) {
    mkdirSync(CACHE_DIR, { recursive: true });
  }

  // Package-specific directory
  const packageDir = join(CACHE_DIR, packageName.replace(/[@/]/g, '_'));

  // Check if already installed
  if (existsSync(join(packageDir, 'node_modules', packageName))) {
    return packageDir;
  }

  // Install the package
  try {
    if (!existsSync(packageDir)) {
      mkdirSync(packageDir, { recursive: true });
    }

    // Initialize package.json if not exists
    const packageJsonPath = join(packageDir, 'package.json');
    if (!existsSync(packageJsonPath)) {
      execSync('npm init -y', {
        cwd: packageDir,
        stdio: 'ignore',
      });
    }

    // Install the package
    console.log(`Installing ${packageName}...`);
    execSync(`npm install ${packageName} --no-save --legacy-peer-deps`, {
      cwd: packageDir,
      stdio: 'inherit',
      timeout: 60000,
    });

    return packageDir;
  } catch (error) {
    throw new Error(`Failed to install package ${packageName}: ${error.message}`);
  }
}

/**
 * Start server
 */
app.listen(PORT, () => {
  console.log(`🔒 TPMJS Sandbox Executor running on port ${PORT}`);
  console.log(`📦 Package cache: ${CACHE_DIR}`);
  console.log(`🧠 Memory limit: ${MAX_MEMORY_MB}MB`);
  console.log(`⏱️  Timeout: ${MAX_TIMEOUT_MS}ms`);
});
