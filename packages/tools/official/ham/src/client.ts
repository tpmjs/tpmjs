/**
 * Minimal HAM Streamable-HTTP MCP client used by every generated tool.
 *
 * HAM's `/mcp` endpoint is stateless: a single `tools/call` JSON-RPC POST is a complete
 * exchange (no initialize handshake needed). Responses may arrive as SSE (`data:` lines)
 * or plain JSON; both are handled.
 */

import { jsonSchema, tool } from 'ai';
import { HAM_TOOL_CATALOG, type HamToolSpec } from './catalog';

const DEFAULT_HAM_API_URL = 'https://ham.donto.org';
const REQUEST_TIMEOUT_MS = 30_000;

export interface HamCallResult {
  /** The HAM tool that was called */
  tool: string;
  /** Parsed JSON payload when HAM returned JSON (then `text` is omitted to avoid a duplicate copy) */
  data?: unknown;
  /** HAM's textual response when it was not JSON */
  text?: string;
}

interface JsonRpcResponse {
  jsonrpc: '2.0';
  id: number | string | null;
  result?: {
    content?: Array<{ type: string; text?: string }>;
    isError?: boolean;
  };
  error?: { code: number; message: string; data?: unknown };
}

function readEnv(name: string): string | undefined {
  const value = globalThis.process?.env?.[name];
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function getBaseUrl(): string {
  return (readEnv('HAM_API_URL') || DEFAULT_HAM_API_URL).replace(/\/+$/, '');
}

function getApiKey(): string {
  const key = readEnv('HAM_API_KEY');
  if (!key) {
    throw new Error(
      'HAM_API_KEY environment variable is required: a HAM per-agent credential for the instance at HAM_API_URL.'
    );
  }
  return key;
}

function parseJsonRpc(raw: string): JsonRpcResponse {
  const trimmed = raw.trim();
  if (trimmed.startsWith('{')) return JSON.parse(trimmed) as JsonRpcResponse;
  const dataLines = trimmed
    .split('\n')
    .filter((line) => line.startsWith('data:'))
    .map((line) => line.slice(5).trim())
    .filter((line) => line.length > 0);
  if (dataLines.length === 0) {
    throw new Error(`HAM returned an unexpected response: ${trimmed.slice(0, 200)}`);
  }
  // A stateless tools/call yields exactly one message; take the last data frame.
  return JSON.parse(dataLines[dataLines.length - 1] as string) as JsonRpcResponse;
}

/**
 * Call one HAM MCP tool by its canonical name (e.g. `ham_remember`) with raw arguments.
 */
export async function callHam(
  toolName: string,
  args: Record<string, unknown> = {}
): Promise<HamCallResult> {
  const apiKey = getApiKey();
  const url = `${getBaseUrl()}/mcp`;
  const body = JSON.stringify({
    jsonrpc: '2.0',
    id: Date.now(),
    method: 'tools/call',
    params: { name: toolName, arguments: args },
  });

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/json, text/event-stream',
      },
      body,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (cause) {
    throw new Error(
      `HAM request to ${url} failed: ${cause instanceof Error ? cause.message : String(cause)}`
    );
  }

  const raw = await response.text();
  if (response.status === 401 || response.status === 403) {
    throw new Error(`HAM rejected the credential (HTTP ${response.status}). Check HAM_API_KEY.`);
  }
  if (!response.ok) {
    throw new Error(`HAM HTTP error ${response.status}: ${raw.slice(0, 300)}`);
  }

  const rpc = parseJsonRpc(raw);
  if (rpc.error) {
    throw new Error(`HAM ${toolName} error ${rpc.error.code}: ${rpc.error.message}`);
  }
  const text = (rpc.result?.content ?? [])
    .filter((c) => c.type === 'text' && typeof c.text === 'string')
    .map((c) => c.text as string)
    .join('\n');
  if (rpc.result?.isError) {
    throw new Error(`HAM ${toolName} failed: ${text || 'unknown error'}`);
  }

  const probe = text.trim();
  if (probe.startsWith('{') || probe.startsWith('[')) {
    try {
      // Structured reply: return the parsed payload once, not the JSON text as well.
      return { tool: toolName, data: JSON.parse(probe) };
    } catch {
      // fall through: not valid JSON after all
    }
  }
  return { tool: toolName, text };
}

function specFor(name: string): HamToolSpec {
  const spec = HAM_TOOL_CATALOG.find((entry) => entry.name === name);
  if (!spec) throw new Error(`Unknown HAM tool in catalog: ${name}`);
  return spec;
}

/**
 * Build a Vercel AI SDK tool that forwards to the named HAM MCP tool, using HAM's own
 * description and input schema as published by its catalog.
 */
export function hamTool(name: string) {
  const spec = specFor(name);
  return tool({
    description: spec.description,
    inputSchema: jsonSchema<Record<string, unknown>>(spec.inputSchema),
    async execute(input): Promise<HamCallResult> {
      return callHam(name, (input ?? {}) as Record<string, unknown>);
    },
  });
}
