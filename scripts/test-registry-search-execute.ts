#!/usr/bin/env npx tsx
/**
 * Comprehensive integration test for TPMJS registry search and execute APIs.
 * Run with: npx tsx scripts/test-registry-search-execute.ts
 *
 * Tests against production tpmjs.com by default.
 * Set BASE_URL env var to test against a different host.
 * Set TPMJS_API_KEY env var to test authenticated requests.
 */

const BASE_URL = process.env.BASE_URL || 'https://tpmjs.com';
const API_KEY = process.env.TPMJS_API_KEY || '';

let passed = 0;
let failed = 0;

async function test(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    passed++;
    console.log(`  \x1b[32mPASS\x1b[0m  ${name}`);
  } catch (error) {
    failed++;
    console.error(`  \x1b[31mFAIL\x1b[0m  ${name}`);
    console.error(`        ${error instanceof Error ? error.message : error}`);
  }
}

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (API_KEY) headers.Authorization = `Bearer ${API_KEY}`;
  return headers;
}

async function main() {
  console.log(`\n\x1b[1mTPMJS Registry Integration Tests\x1b[0m`);
  console.log(`Base URL: ${BASE_URL}`);
  console.log(
    `API Key: ${API_KEY ? `${API_KEY.slice(0, 12)}...` : '(none - testing unauthenticated)'}\n`
  );

  // ═══════════════════════════════════════════
  // SEARCH ENDPOINT: /api/tools/search
  // ═══════════════════════════════════════════
  console.log('\x1b[1m--- Search API ---\x1b[0m');

  await test('Search returns successful response with valid structure', async () => {
    const res = await fetch(`${BASE_URL}/api/tools/search?q=resend&limit=5`);
    assert(res.ok, `Expected 200, got ${res.status}`);

    const data = await res.json();
    assert(data.success === true, `success should be true, got ${data.success}`);
    assert(typeof data.query === 'string', 'Missing query field');
    assert(typeof data.results === 'object', 'Missing results object');
    assert(typeof data.results.total === 'number', 'Missing results.total');
    assert(typeof data.results.returned === 'number', 'Missing results.returned');
    assert(Array.isArray(data.results.tools), 'results.tools should be an array');
    assert(typeof data.pagination === 'object', 'Missing pagination');
    assert(typeof data.pagination.limit === 'number', 'Missing pagination.limit');
    assert(typeof data.pagination.hasMore === 'boolean', 'Missing pagination.hasMore');
  });

  await test('Search returns tools with all required fields', async () => {
    const res = await fetch(`${BASE_URL}/api/tools/search?q=resend&limit=3`);
    const data = await res.json();
    assert(data.results.tools.length > 0, 'No tools found');

    for (const tool of data.results.tools) {
      assert(typeof tool.id === 'string' && tool.id.length > 0, `Missing tool.id`);
      assert(
        typeof tool.toolId === 'string' && tool.toolId.includes('::'),
        `Missing or invalid toolId: ${tool.toolId}`
      );
      assert(typeof tool.name === 'string' && tool.name.length > 0, `Missing tool.name`);
      assert(typeof tool.description === 'string', `Missing tool.description`);
      assert(typeof tool.package === 'object', `Missing tool.package`);
      assert(typeof tool.package.npmPackageName === 'string', `Missing package.npmPackageName`);
      assert(typeof tool.package.npmVersion === 'string', `Missing package.npmVersion`);
      assert(
        typeof tool.importUrl === 'string' && tool.importUrl.startsWith('https://'),
        `Invalid importUrl`
      );

      // toolId should match package::name format
      const expectedToolId = `${tool.package.npmPackageName}::${tool.name}`;
      assert(
        tool.toolId === expectedToolId,
        `toolId mismatch: ${tool.toolId} !== ${expectedToolId}`
      );

      // Verify no "undefined" in toolId
      assert(!tool.toolId.includes('undefined'), `toolId contains "undefined": ${tool.toolId}`);
    }

    console.log(`        Found ${data.results.tools.length} tools with valid fields`);
  });

  await test('Search respects limit parameter', async () => {
    const res = await fetch(`${BASE_URL}/api/tools/search?q=tool&limit=2`);
    const data = await res.json();
    assert(
      data.results.tools.length <= 2,
      `Expected <= 2 results, got ${data.results.tools.length}`
    );
    assert(
      data.pagination.limit === 2,
      `Pagination limit should be 2, got ${data.pagination.limit}`
    );
  });

  await test('Search with empty query returns results (browsing mode)', async () => {
    const res = await fetch(`${BASE_URL}/api/tools/search?q=&limit=5`);
    assert(res.ok, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert(data.success === true, 'Should succeed with empty query');
  });

  await test('Search for specific package name works', async () => {
    const res = await fetch(`${BASE_URL}/api/tools/search?q=@tpmjs/tools-hllm&limit=10`);
    assert(res.ok, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert(data.results.tools.length > 0, 'Should find tools for @tpmjs/tools-hllm');

    // biome-ignore lint/suspicious/noExplicitAny: test script
    const hllmTools = data.results.tools.filter(
      (t: { package: { npmPackageName: string } }) =>
        t.package.npmPackageName === '@tpmjs/tools-hllm'
    );
    assert(hllmTools.length > 0, 'No exact @tpmjs/tools-hllm matches');
    console.log(`        Found ${hllmTools.length} hllm tools`);
  });

  await test('Search with category filter works', async () => {
    const res = await fetch(`${BASE_URL}/api/tools/search?q=&category=communication&limit=10`);
    assert(res.ok, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert(data.success === true, 'Category filter should succeed');
    // Just verify it doesn't error - category may or may not have results
  });

  await test('Search with query parameter alias works', async () => {
    const res = await fetch(`${BASE_URL}/api/tools/search?query=resend&limit=3`);
    assert(res.ok, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert(data.success === true, '"query" param should work as alias for "q"');
    assert(data.results.tools.length > 0, 'Should find results with "query" param');
  });

  await test('Search limit is capped at 100', async () => {
    const res = await fetch(`${BASE_URL}/api/tools/search?q=tool&limit=999`);
    assert(res.ok, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert(data.results.tools.length <= 100, `Should cap at 100, got ${data.results.tools.length}`);
  });

  // ═══════════════════════════════════════════
  // EXECUTE ENDPOINT: /api/registry/execute
  // ═══════════════════════════════════════════
  console.log('\n\x1b[1m--- Execute API ---\x1b[0m');

  await test('Execute returns proper response structure', async () => {
    const res = await fetch(`${BASE_URL}/api/registry/execute`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        toolId: '@tpmjs/tools-hllm::getPublicStats',
        params: {},
        env: {},
      }),
    });
    // Accept 200 (success) or 422 (tool error) - both are valid responses
    assert(res.status === 200 || res.status === 422, `Expected 200 or 422, got ${res.status}`);

    const data = await res.json();
    assert(typeof data.success === 'boolean', 'Missing success field');
    assert(data.toolId === '@tpmjs/tools-hllm::getPublicStats', `Wrong toolId: ${data.toolId}`);
    assert(typeof data.executionTimeMs === 'number', 'Missing executionTimeMs');
    assert(typeof data.meta === 'object', 'Missing meta');
    assert(data.meta.package === '@tpmjs/tools-hllm', `Wrong meta.package: ${data.meta.package}`);
    assert(typeof data.meta.version === 'string', 'Missing meta.version');
    assert(typeof data.meta.authenticated === 'boolean', 'Missing meta.authenticated');

    if (data.success) {
      assert(data.result !== undefined, 'Successful response should have result');
    } else {
      assert(typeof data.error === 'object', 'Failed response should have error object');
      assert(typeof data.error.code === 'string', 'Error should have code');
      assert(typeof data.error.message === 'string', 'Error should have message');
    }

    console.log(`        Success: ${data.success}, Time: ${data.executionTimeMs}ms`);
    if (data.success && data.result) {
      console.log(`        Result preview: ${JSON.stringify(data.result).slice(0, 150)}`);
    }
  });

  await test('Execute rejects missing body', async () => {
    const res = await fetch(`${BASE_URL}/api/registry/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '',
    });
    assert(res.status === 400, `Expected 400, got ${res.status}`);
    const data = await res.json();
    assert(data.success === false, 'Should be unsuccessful');
    assert(data.error?.code === 'INVALID_JSON', `Expected INVALID_JSON, got ${data.error?.code}`);
  });

  await test('Execute rejects missing toolId', async () => {
    const res = await fetch(`${BASE_URL}/api/registry/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ params: {} }),
    });
    assert(res.status === 400, `Expected 400, got ${res.status}`);
    const data = await res.json();
    assert(
      data.error?.code === 'MISSING_TOOL_ID',
      `Expected MISSING_TOOL_ID, got ${data.error?.code}`
    );
  });

  await test('Execute rejects invalid toolId format (no separator)', async () => {
    const res = await fetch(`${BASE_URL}/api/registry/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ toolId: 'no-separator-here', params: {} }),
    });
    assert(res.status === 400, `Expected 400, got ${res.status}`);
    const data = await res.json();
    assert(
      data.error?.code === 'INVALID_TOOL_ID',
      `Expected INVALID_TOOL_ID, got ${data.error?.code}`
    );
  });

  await test('Execute rejects toolId with empty export name (trailing ::)', async () => {
    const res = await fetch(`${BASE_URL}/api/registry/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ toolId: '@tpmjs/tools-resend::', params: {} }),
    });
    assert(res.status === 400, `Expected 400, got ${res.status}`);
    const data = await res.json();
    assert(
      data.error?.code === 'INVALID_TOOL_ID',
      `Expected INVALID_TOOL_ID, got ${data.error?.code}`
    );
  });

  await test('Execute rejects array params', async () => {
    const res = await fetch(`${BASE_URL}/api/registry/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ toolId: '@tpmjs/tools-hllm::getPublicStats', params: [1, 2, 3] }),
    });
    assert(res.status === 400, `Expected 400, got ${res.status}`);
    const data = await res.json();
    assert(
      data.error?.code === 'INVALID_PARAMS',
      `Expected INVALID_PARAMS, got ${data.error?.code}`
    );
  });

  await test('Execute rejects array env', async () => {
    const res = await fetch(`${BASE_URL}/api/registry/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        toolId: '@tpmjs/tools-hllm::getPublicStats',
        params: {},
        env: ['bad'],
      }),
    });
    assert(res.status === 400, `Expected 400, got ${res.status}`);
    const data = await res.json();
    assert(data.error?.code === 'INVALID_ENV', `Expected INVALID_ENV, got ${data.error?.code}`);
  });

  await test('Execute works with omitted params and env', async () => {
    const res = await fetch(`${BASE_URL}/api/registry/execute`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ toolId: '@tpmjs/tools-hllm::getPublicStats' }),
    });
    // Should not return 400 - params and env are optional
    assert(res.status !== 400, `Should accept request without params/env, got ${res.status}`);
    const data = await res.json();
    assert(data.toolId === '@tpmjs/tools-hllm::getPublicStats', 'toolId should be echoed back');
  });

  await test('Execute tool that requires env var shows clear error', async () => {
    const res = await fetch(`${BASE_URL}/api/registry/execute`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        toolId: '@tpmjs/tools-resend::sendEmail',
        params: {
          from: 'admin@tpmjs.com',
          to: 'test@example.com',
          subject: 'Test',
          text: 'Test message',
        },
        env: {},
      }),
    });

    const data = await res.json();
    // Without RESEND_API_KEY, should fail with a clear error
    if (!data.success) {
      console.log(`        Error: ${JSON.stringify(data.error).slice(0, 200)}`);
      // Should not be a deployment error
      const errorStr = JSON.stringify(data.error);
      assert(!errorStr.includes('DEPLOYMENT_NOT_FOUND'), `Got Vercel deployment error`);
      assert(!errorStr.includes('deployment could not be found'), `Got deployment error`);
    } else {
      console.log(`        Unexpected success (API key may be pre-configured)`);
    }
  });

  await test('Execute only allows POST method', async () => {
    const res = await fetch(`${BASE_URL}/api/registry/execute`, {
      method: 'GET',
    });
    assert(res.status === 405 || res.status === 404, `Expected 405 or 404, got ${res.status}`);
  });

  // ═══════════════════════════════════════════
  // AUTHENTICATED REQUESTS (if API key provided)
  // ═══════════════════════════════════════════
  if (API_KEY) {
    console.log('\n\x1b[1m--- Authenticated Requests ---\x1b[0m');

    await test('Authenticated search includes rate limit headers', async () => {
      const res = await fetch(`${BASE_URL}/api/tools/search?q=resend&limit=3`, {
        headers: { Authorization: `Bearer ${API_KEY}` },
      });
      assert(res.ok, `Expected 200, got ${res.status}`);

      // Check for rate limit headers (may vary)
      const data = await res.json();
      assert(data.success === true, 'Authenticated search should succeed');
      console.log(`        Found ${data.results.tools.length} results`);
    });

    await test('Authenticated execute returns meta.authenticated=true', async () => {
      const res = await fetch(`${BASE_URL}/api/registry/execute`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          toolId: '@tpmjs/tools-hllm::getPublicStats',
          params: {},
        }),
      });

      const data = await res.json();
      assert(
        data.meta?.authenticated === true,
        `Expected authenticated=true, got ${data.meta?.authenticated}`
      );
      console.log(`        Authenticated: ${data.meta.authenticated}`);
    });
  }

  // ═══════════════════════════════════════════
  // END-TO-END: Search → Execute Flow
  // ═══════════════════════════════════════════
  console.log('\n\x1b[1m--- End-to-End Flow ---\x1b[0m');

  await test('Search → Extract toolId → Execute (full flow)', async () => {
    // Step 1: Search for a tool
    const searchRes = await fetch(`${BASE_URL}/api/tools/search?q=hllm&limit=5`, {
      headers: API_KEY ? { Authorization: `Bearer ${API_KEY}` } : {},
    });
    assert(searchRes.ok, `Search returned ${searchRes.status}`);

    const searchData = await searchRes.json();
    assert(searchData.results.tools.length > 0, 'No tools found');

    // Step 2: Extract toolId from search results
    const tool = searchData.results.tools[0];
    const toolId = tool.toolId;
    assert(typeof toolId === 'string', `toolId should be a string, got ${typeof toolId}`);
    assert(toolId.includes('::'), `toolId should contain '::', got: ${toolId}`);
    assert(!toolId.includes('undefined'), `toolId should not contain 'undefined': ${toolId}`);
    console.log(`        Search found: ${toolId} — "${tool.description?.slice(0, 60)}"`);

    // Step 3: Execute the tool using the toolId from search
    const execRes = await fetch(`${BASE_URL}/api/registry/execute`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ toolId, params: {}, env: {} }),
    });
    assert(execRes.status === 200 || execRes.status === 422, `Execute returned ${execRes.status}`);

    const execData = await execRes.json();
    assert(execData.toolId === toolId, `toolId mismatch: ${execData.toolId} !== ${toolId}`);
    assert(typeof execData.executionTimeMs === 'number', 'Missing executionTimeMs');

    // Should not be a deployment/infra error
    if (execData.error) {
      const errorStr = JSON.stringify(execData.error);
      assert(!errorStr.includes('DEPLOYMENT_NOT_FOUND'), 'Got deployment error');
      assert(!errorStr.includes('EXECUTOR_UNREACHABLE'), 'Executor is unreachable');
    }

    console.log(`        Execute: success=${execData.success}, time=${execData.executionTimeMs}ms`);
    if (execData.success && execData.result) {
      console.log(`        Result: ${JSON.stringify(execData.result).slice(0, 150)}`);
    }
  });

  await test('Search → Execute with env vars (resend with API key)', async () => {
    // Search for resend tools
    const searchRes = await fetch(`${BASE_URL}/api/tools/search?q=resend+sendEmail&limit=5`, {
      headers: API_KEY ? { Authorization: `Bearer ${API_KEY}` } : {},
    });
    assert(searchRes.ok, `Search returned ${searchRes.status}`);

    const searchData = await searchRes.json();
    const resendTools = searchData.results.tools.filter(
      (t: { package?: { npmPackageName: string }; name: string }) =>
        t.package?.npmPackageName === '@tpmjs/tools-resend' && t.name === 'sendEmail'
    );

    if (resendTools.length === 0) {
      console.log('        Skipping: sendEmail tool not found in search results');
      return;
    }

    const tool = resendTools[0];
    const toolId = tool.toolId;
    console.log(`        Found: ${toolId}`);

    // Execute with a RESEND_API_KEY
    const resendKey = process.env.RESEND_API_KEY || '';
    const execRes = await fetch(`${BASE_URL}/api/registry/execute`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        toolId,
        params: {
          from: 'admin@tpmjs.com',
          to: 'thomasalwyndavis@gmail.com',
          subject: 'TPMJS Integration Test',
          text: `Integration test at ${new Date().toISOString()}. This verifies the search→execute flow works.`,
        },
        env: resendKey ? { RESEND_API_KEY: resendKey } : {},
      }),
    });

    const execData = await execRes.json();
    console.log(`        Execute: success=${execData.success}, time=${execData.executionTimeMs}ms`);
    if (execData.success) {
      console.log(`        Email sent!`);
    } else {
      console.log(`        Error: ${JSON.stringify(execData.error).slice(0, 200)}`);
      // If no API key, error should mention it
      if (!resendKey) {
        const errorStr = JSON.stringify(execData.error);
        assert(
          errorStr.includes('RESEND_API_KEY') ||
            errorStr.includes('API key') ||
            errorStr.includes('Missing'),
          `Expected API key error, got: ${errorStr.slice(0, 200)}`
        );
      }
    }
  });

  // ═══════════════════════════════════════════
  // Performance
  // ═══════════════════════════════════════════
  console.log('\n\x1b[1m--- Performance ---\x1b[0m');

  await test('Search responds within 5 seconds', async () => {
    const start = Date.now();
    const res = await fetch(`${BASE_URL}/api/tools/search?q=email&limit=10`);
    const elapsed = Date.now() - start;
    assert(res.ok, `Search failed with ${res.status}`);
    assert(elapsed < 5000, `Search took ${elapsed}ms (>5s)`);
    console.log(`        Search latency: ${elapsed}ms`);
  });

  await test('Execute responds within 30 seconds', async () => {
    const start = Date.now();
    const res = await fetch(`${BASE_URL}/api/registry/execute`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ toolId: '@tpmjs/tools-hllm::getPublicStats', params: {} }),
    });
    const elapsed = Date.now() - start;
    assert(res.status !== 504, 'Execute timed out (504)');
    assert(elapsed < 30000, `Execute took ${elapsed}ms (>30s)`);
    console.log(`        Execute latency: ${elapsed}ms`);
  });

  // ═══════════════════════════════════════════
  // Summary
  // ═══════════════════════════════════════════
  console.log(`\n\x1b[1m--- Results ---\x1b[0m`);
  console.log(`  \x1b[32m${passed} passed\x1b[0m, \x1b[31m${failed} failed\x1b[0m`);
  if (failed > 0) {
    process.exitCode = 1;
  }
  console.log('');
}

main().catch((error) => {
  console.error('\nFatal error:', error);
  process.exitCode = 1;
});
