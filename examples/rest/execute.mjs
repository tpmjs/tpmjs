// Minimal REST client for the TPMJS registry execute endpoint.
// Runs on Node 18+ with zero dependencies (global fetch).
//
//   node execute.mjs
//
// Optional: set TPMJS_API_KEY in your env for higher rate limits.

const ENDPOINT = 'https://tpmjs.com/api/registry/execute';

const body = {
  toolId: '@tpmjs/official-base64-encode::base64EncodeTool',
  params: { data: 'Hello, TPMJS!' },
  // env: { SOME_API_KEY: '...' }, // only for tools that require keys
};

const headers = { 'Content-Type': 'application/json' };
if (process.env.TPMJS_API_KEY) {
  headers.Authorization = `Bearer ${process.env.TPMJS_API_KEY}`;
}

const res = await fetch(ENDPOINT, {
  method: 'POST',
  headers,
  body: JSON.stringify(body),
});

const data = await res.json();

if (!data.success) {
  console.error('Tool execution failed:', data.error);
  process.exit(1);
}

console.log('toolId:   ', data.toolId);
console.log('result:   ', data.result); // { base64: 'SGVsbG8sIFRQTUpTIQ==', byteLength: 13 }
console.log('durationMs:', data.executionTimeMs);
