/**
 * MCP protocol version negotiation.
 *
 * The MCP streamable-HTTP transport requires the server to honor the client's
 * requested protocol version when it is supported, and otherwise respond with
 * the latest version the server supports. Hard-coding a single version (the old
 * behavior returned `2024-11-05` unconditionally) force-downgrades modern clients
 * to the legacy HTTP+SSE transport and confuses strict streamable-HTTP clients
 * (e.g. codex's Rust MCP client), which then refuse to attach tools.
 */

/**
 * Protocol versions this server speaks. Ordered oldest → newest.
 * - `2024-11-05` — legacy, kept for old clients.
 * - `2025-03-26` — streamable HTTP transport.
 * - `2025-06-18` — streamable HTTP + `MCP-Protocol-Version` request header. We
 *   never inspect that header, so tolerating it is automatic and this version is
 *   compatible with no further changes.
 */
export const SUPPORTED_PROTOCOL_VERSIONS = ['2024-11-05', '2025-03-26', '2025-06-18'] as const;

/** The newest protocol version this server supports (used as the fallback). */
export const LATEST_PROTOCOL_VERSION = '2025-06-18';

/**
 * Negotiate the MCP protocol version for an `initialize` response.
 *
 * Honors the client's requested version when we support it; otherwise falls back
 * to the latest version this server supports, per the MCP spec.
 */
export function negotiateProtocolVersion(requested?: unknown): string {
  if (
    typeof requested === 'string' &&
    (SUPPORTED_PROTOCOL_VERSIONS as readonly string[]).includes(requested)
  ) {
    return requested;
  }
  return LATEST_PROTOCOL_VERSION;
}
