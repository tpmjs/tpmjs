export const TPMJS_ORIGIN = 'https://tpmjs.com';

export interface CollectionMcpTarget {
  username: string;
  slug: string;
}

export interface CollectionMcpAuth {
  /** Literal token or shell expression inserted into generated client configuration. */
  bearerToken?: string;
}

function requiredSegment(value: string, label: 'username' | 'slug'): string {
  const normalized = label === 'username' ? value.trim().replace(/^@+/, '') : value.trim();
  if (!normalized) throw new Error(`Collection ${label} is required`);
  return normalized;
}

/** Build the one canonical, human-readable HTTP MCP endpoint for a collection. */
export function buildCollectionMcpUrl(target: CollectionMcpTarget, origin = TPMJS_ORIGIN): string {
  const username = requiredSegment(target.username, 'username');
  const slug = requiredSegment(target.slug, 'slug');
  const base = new URL(origin).origin;

  return `${base}/@${encodeURIComponent(username)}/collections/${encodeURIComponent(slug)}/mcp`;
}

/** Produce a stable Claude-compatible server name from an arbitrary collection slug. */
export function buildCollectionMcpServerName(slug: string): string {
  const normalized = requiredSegment(slug, 'slug')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 54)
    .replace(/-+$/g, '');

  return `tpmjs-${normalized || 'collection'}`;
}

/** Build the supported Claude Code command for the collection's HTTP transport. */
export function buildClaudeCodeCollectionCommand(
  target: CollectionMcpTarget,
  auth: CollectionMcpAuth = {}
): string {
  const command = `claude mcp add --transport http ${buildCollectionMcpServerName(target.slug)} ${buildCollectionMcpUrl(target)}`;
  const authorizationHeader = auth.bearerToken
    ? JSON.stringify(`Authorization: Bearer ${auth.bearerToken}`)
    : null;
  return authorizationHeader ? `${command} --header ${authorizationHeader}` : command;
}

/** Build native HTTP configuration for clients that consume Claude Desktop-style JSON. */
export function buildClaudeDesktopCollectionConfig(
  target: CollectionMcpTarget,
  auth: CollectionMcpAuth = {}
): string {
  const server = {
    type: 'http',
    url: buildCollectionMcpUrl(target),
    ...(auth.bearerToken && {
      headers: { Authorization: `Bearer ${auth.bearerToken}` },
    }),
  };

  return JSON.stringify(
    { mcpServers: { [buildCollectionMcpServerName(target.slug)]: server } },
    null,
    2
  );
}
