---
'@tpmjs/mcp-client': minor
'@tpmjs/bridge': patch
---

Add Streamable HTTP and legacy SSE connections, protocol-aware fallback,
request-scoped connection timeouts, negotiated transport reporting, and
leak-free failure cleanup while preserving the existing stdio API. Teach the
bridge CLI to describe either local commands or remote URLs in its server list.
