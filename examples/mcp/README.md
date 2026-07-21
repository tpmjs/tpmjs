# MCP surface — one URL, every tool in a collection

Any TPMJS collection is a Model Context Protocol (MCP) server at a single URL. Add that URL to Claude
Code, Claude Desktop, Cursor, or any MCP client and every tool in the collection appears — no per‑tool
wiring. This example is config only; there is nothing to install or run.

## The canonical collection MCP URL

```
https://tpmjs.com/@{user}/collections/{slug}/mcp
```

(Source of truth: [`InstallationSection.tsx`](../../apps/web/src/components/collections/InstallationSection.tsx).)

## Add a public collection to Claude Code

Positional args (name, url) come **before** flags so `-H` doesn't swallow them:

```bash
claude mcp add {slug} https://tpmjs.com/@{user}/collections/{slug}/mcp -t http
```

Then verify the connection inside Claude Code:

```
/mcp
```

You should see the server connected with the collection's tools available.

### Private collections

Add your API key as a bearer header (get one at
`https://tpmjs.com/dashboard/settings/tpmjs-api-keys`):

```bash
claude mcp add {slug} https://tpmjs.com/@{user}/collections/{slug}/mcp -t http \
  -H "Authorization: Bearer YOUR_TPMJS_API_KEY"
```

## Add to Claude Desktop instead

Put this in your `claude_desktop_config.json` (add a `headers` object with the bearer token for
private collections):

```json
{
  "mcpServers": {
    "{slug}": {
      "type": "http",
      "url": "https://tpmjs.com/@{user}/collections/{slug}/mcp"
    }
  }
}
```

## Generate the config with the CLI

The `tpm` CLI can write the right config for your client automatically:

```bash
tpm mcp config {user}/{slug} --client claude    # or: cursor | windsurf
```

## Alternative: the whole registry as one MCP server

Prefer *search‑then‑execute* over a curated collection? Point the client at the registry‑wide MCP
endpoint, which exposes `search_tools` and `execute_tool` across every tool:

```bash
claude mcp add tpmjs-registry https://tpmjs.com/api/mcp/registry/http -t http
```

(Streamable HTTP transport; source:
[`apps/web/src/app/api/mcp/registry/[transport]/route.ts`](../../apps/web/src/app/api/mcp/registry/%5Btransport%5D/route.ts).)

## Troubleshooting

- List configured servers: `claude mcp list`
- Re‑add: `claude mcp remove {slug}` then the `add` command again
- Connection timeout: `MCP_TIMEOUT=10000 claude`

## Notes

- Replace `{user}` and `{slug}` with a real username and collection slug. Everything else — the URL
  shape, the `claude mcp add … -t http` command, the Claude Desktop JSON, the `/mcp` verify step — is
  taken verbatim from the app's Installation UI and CLI.
- Docs: <https://tpmjs.com/docs>.
