/**
 * Railway Dynamic Tool Executor
 * Runs with --experimental-network-imports to support esm.sh imports
 */

import cors from 'cors';
import express from 'express';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Cache for imported tool modules
const moduleCache = new Map();

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    cacheSize: moduleCache.size,
    nodeVersion: process.version,
    experimentalNetworkImports: true,
  });
});

/**
 * Load and describe a tool from esm.sh
 * Returns tool metadata (description, schema) without executing
 */
app.post('/load-and-describe', async (req, res) => {
  const { packageName, exportName, version, importUrl } = req.body;

  if (!packageName || !exportName || !version) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: packageName, exportName, version',
    });
  }

  const cacheKey = `${packageName}::${exportName}`;

  try {
    let toolModule;

    // Check cache first
    if (moduleCache.has(cacheKey)) {
      console.log(`✅ Cache hit: ${cacheKey}`);
      toolModule = moduleCache.get(cacheKey);
    } else {
      // Dynamic import from esm.sh using fetch + eval
      // Note: import() doesn't support HTTPS URLs without custom loader in Node.js
      const url = importUrl || `https://esm.sh/${packageName}@${version}`;
      console.log(`📦 Importing: ${url}`);

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch module: ${response.statusText}`);
      }

      const moduleCode = await response.text();

      // Create a module wrapper that captures exports
      const moduleExports = {};
      const moduleWrapper = new Function('exports', 'module', 'require', moduleCode);
      moduleWrapper(moduleExports, { exports: moduleExports }, require);

      // esm.sh returns ES modules, try to get default or named export
      const module = moduleExports.default || moduleExports;
      toolModule = module[exportName] || module;

      if (!toolModule) {
        console.error(`❌ Export "${exportName}" not found. Available:`, Object.keys(module));
        return res.status(404).json({
          success: false,
          error: `Export "${exportName}" not found in module`,
          availableExports: Object.keys(module),
        });
      }

      // Validate it's an AI SDK tool
      if (!toolModule.description || !toolModule.execute) {
        console.error(`❌ Invalid AI SDK tool structure:`, {
          hasDescription: !!toolModule.description,
          hasExecute: !!toolModule.execute,
          hasInputSchema: !!toolModule.inputSchema,
          keys: Object.keys(toolModule),
        });
        return res.status(400).json({
          success: false,
          error: 'Invalid AI SDK tool structure (missing description or execute)',
          toolKeys: Object.keys(toolModule),
        });
      }

      // Cache it
      moduleCache.set(cacheKey, toolModule);
      console.log(`✅ Cached: ${cacheKey}`);
    }

    // Extract tool definition (description + schema)
    // AI SDK v6 tools have: description, inputSchema, execute
    res.json({
      success: true,
      tool: {
        exportName,
        description: toolModule.description,
        inputSchema: toolModule.inputSchema || toolModule.parameters?.shape || {},
      },
    });
  } catch (error) {
    console.error('❌ Failed to load tool:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
});

/**
 * Execute a dynamically loaded tool with parameters
 */
app.post('/execute-tool', async (req, res) => {
  const { packageName, exportName, version, importUrl, params } = req.body;

  if (!packageName || !exportName || !version) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: packageName, exportName, version',
    });
  }

  const cacheKey = `${packageName}::${exportName}`;
  const startTime = Date.now();

  try {
    let toolModule;

    // Check cache or import
    if (moduleCache.has(cacheKey)) {
      console.log(`✅ Using cached tool: ${cacheKey}`);
      toolModule = moduleCache.get(cacheKey);
    } else {
      const url = importUrl || `https://esm.sh/${packageName}@${version}`;
      console.log(`📦 Importing for execution: ${url}`);

      const module = await import(url);
      toolModule = module[exportName];

      if (!toolModule || !toolModule.execute) {
        return res.status(404).json({
          success: false,
          error: 'Tool not found or invalid',
          executionTimeMs: Date.now() - startTime,
        });
      }

      moduleCache.set(cacheKey, toolModule);
    }

    // Execute the tool
    console.log(`🚀 Executing ${cacheKey} with params:`, params);
    const result = await toolModule.execute(params || {});

    const executionTimeMs = Date.now() - startTime;
    console.log(`✅ Execution complete in ${executionTimeMs}ms`);

    res.json({
      success: true,
      output: result,
      executionTimeMs,
    });
  } catch (error) {
    const executionTimeMs = Date.now() - startTime;
    console.error('❌ Tool execution failed:', error);

    res.status(500).json({
      success: false,
      error: error.message,
      executionTimeMs,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
});

/**
 * Clear module cache (for debugging)
 */
app.post('/cache/clear', (req, res) => {
  const size = moduleCache.size;
  moduleCache.clear();
  console.log(`🗑️  Cleared cache (${size} entries)`);

  res.json({
    success: true,
    message: `Cleared ${size} cached modules`,
  });
});

/**
 * Get cache statistics
 */
app.get('/cache/stats', (req, res) => {
  const entries = Array.from(moduleCache.keys());

  res.json({
    success: true,
    cacheSize: moduleCache.size,
    cachedTools: entries,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Railway Tool Executor running on port ${PORT}`);
  console.log(`📦 Experimental network imports: ENABLED`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`🛠️  Endpoints:`);
  console.log(`   POST /load-and-describe - Load tool and get schema`);
  console.log(`   POST /execute-tool - Execute a tool with params`);
  console.log(`   POST /cache/clear - Clear module cache`);
  console.log(`   GET /cache/stats - Get cache statistics`);
});
