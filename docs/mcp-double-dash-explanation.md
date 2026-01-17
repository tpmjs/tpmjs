# MCP Routes Double Dash Explanation

## Summary

The double dashes (`--`) in MCP server routes are **intentional design choices**, not bugs. They serve as unambiguous delimiters between package names and tool names.

## Root Cause

The double dashes originate in `apps/web/src/lib/mcp/tool-converter.ts`.

### Registry Tool Naming (lines 27-53)

```typescript
export function sanitizeMcpName(packageName: string, toolName: string): string {
  // Remove @ and convert / to -
  let sanitizedPkg = packageName.replace(/^@/, '').replace(/\//g, '-');

  // Remove common prefixes to shorten
  sanitizedPkg = sanitizedPkg.replace(/^tpmjs-tools-/, '');
  sanitizedPkg = sanitizedPkg.replace(/^tpmjs-/, '');

  // Remove 'Tool' suffix from tool name
  const sanitizedTool = toolName.replace(/Tool$/, '');

  const fullName = `${sanitizedPkg}--${sanitizedTool}`;  // <-- DOUBLE DASH
  // ...
}
```

### Bridge Tool Naming (lines 59-64)

```typescript
export function sanitizeBridgeToolName(serverId: string, toolName: string): string {
  const sanitizedServer = serverId.replace(/[^a-zA-Z0-9_-]/g, '-');
  const sanitizedTool = toolName.replace(/[^a-zA-Z0-9_-]/g, '-');
  return `bridge--${sanitizedServer}--${toolName}`;  // <-- DOUBLE DASHES
}
```

## Naming Patterns

| Type | Pattern | Example |
|------|---------|---------|
| Registry tools | `{package}--{toolName}` | `unsandbox--executeCodeAsync` |
| Bridge tools | `bridge--{serverId}--{toolName}` | `bridge--chrome--screenshot` |

## Why Double Dashes?

1. **Single dashes are allowed within names** - Package names like `@tpmjs/tools-hello-world` contain single dashes
2. **Unambiguous delimiter** - A double dash provides a clear separator that won't appear within package or tool names
3. **Correct parsing** - Enables reliable splitting of the full MCP tool name back into components

## Parsing Logic

In `apps/web/src/lib/mcp/tool-converter.ts` (lines 102-146):

```typescript
export function parseToolName(mcpName: string): ParsedToolName | null {
  // Check for bridge tools first
  const bridgeMatch = mcpName.match(/^bridge--([^-]+(?:-[^-]+)*)--(.+)$/);
  if (bridgeMatch?.[1] && bridgeMatch[2]) {
    return {
      type: 'bridge',
      serverId: bridgeMatch[1],
      toolName: bridgeMatch[2],
    };
  }

  // Parse registry tools
  const match = mcpName.match(/^(.+)--(.+)$/);  // Split on double dash
  if (!match || !match[1] || !match[2]) return null;
  // ...
}
```

## Files Involved

| File | Lines | Purpose |
|------|-------|---------|
| `apps/web/src/lib/mcp/tool-converter.ts` | 27-53, 59-64, 102-146 | Tool name sanitization and parsing |
| `apps/web/src/lib/mcp/handlers.ts` | 139-146 | Tool name parsing during MCP calls |

## Conclusion

The double dashes are a deliberate architectural decision to enable:
- Clean separation of package and tool names
- Support for single dashes within component names
- Reliable bidirectional conversion between full MCP names and their components
