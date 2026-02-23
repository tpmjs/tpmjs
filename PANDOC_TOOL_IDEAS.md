# Pandoc Tool Ideas for TPMJS

## The Challenge

Pandoc is a CLI binary (Haskell), not a JavaScript library. TPMJS tools run in a constrained Node.js executor that:

- Has no filesystem access (unless sandbox is enabled)
- Cannot spawn child processes (unless sandbox is enabled)
- Has a 120-second execution timeout
- Must be single-shot (one call in, one result out)
- Should work via `npm install` alone (the executor runs `npm install <package>` then executes)

This means we can't just shell out to `pandoc` like you would locally. We need a different strategy.

---

## Approach 1: Pandoc HTTP Microservice on Railway

Deploy a thin HTTP wrapper around pandoc on Railway (similar to `agent-sandbox` and `tpmjs-tools-executor`).

**How it works:**
- Deploy a Docker container with pandoc installed + a small HTTP server (Deno or Node)
- Exposes `POST /convert` accepting `{ content, from, to, options }`
- The TPMJS tool calls this service via `fetch()`
- Returns converted content as a string or base64 (for binary formats like docx/pdf)

**Tool surface:**
- `pandoc.convert` - Core conversion (markdown -> html, latex -> docx, etc.)
- `pandoc.listFormats` - Returns supported input/output formats
- `pandoc.convertWithTemplate` - Conversion with a custom template passed as string

**Pros:**
- Full pandoc power, all 40+ formats
- Binary output support (PDF, DOCX, EPUB)
- Predictable, we control the pandoc version
- Railway already hosts two services, adding a third is straightforward

**Cons:**
- Another service to maintain and pay for
- Network hop adds latency
- Needs its own auth (API key in env vars)
- Tool is coupled to our infrastructure, not truly portable as an npm package

**Railway service sketch:**
```
templates/pandoc-service/
  Dockerfile          # FROM pandoc/core, add deno/node server
  server.ts           # POST /convert endpoint
  railway.json        # Service config
```

---

## Approach 2: Pandoc WASM (In-Process)

Use a WebAssembly build of pandoc that runs directly in Node.js. The `pandoc-wasm` npm package exists and bundles pandoc as WASM.

**How it works:**
- Tool declares `pandoc-wasm` as a dependency in package.json
- Executor runs `npm install @tpmjs/tools-pandoc` which pulls in the WASM binary
- Tool calls pandoc in-process, no network hop, no subprocess

**Tool surface:**
- `pandoc.convert` - Convert between any supported formats
- `pandoc.toHtml` - Convenience wrapper (any format -> HTML)
- `pandoc.toMarkdown` - Convenience wrapper (any format -> Markdown)
- `pandoc.toLatex` - Convenience wrapper (any format -> LaTeX)
- `pandoc.extractMetadata` - Parse YAML front matter / document metadata

**Pros:**
- Fully self-contained npm package, works anywhere the executor runs
- No external service dependency
- Portable - anyone can `npm install` and use it
- Fits the TPMJS model perfectly (just another dependency)

**Cons:**
- WASM pandoc may not support all formats (PDF generation needs LaTeX)
- Large package size (~30-50MB WASM binary), slow `npm install` in executor
- May hit executor memory limits
- WASM pandoc maturity is uncertain, needs validation

**Validation needed:**
```bash
npm install pandoc-wasm
# Test: does it actually work in Node.js?
# Test: what formats are supported?
# Test: what's the package size?
# Test: does it fit within executor timeout for install?
```

---

## Approach 3: Hybrid - JS Libraries for Common Conversions

Skip pandoc entirely for the most common conversions and use battle-tested JS libraries. Only reach for pandoc (via service) for exotic formats.

**JS-native conversions:**
| Conversion | Library |
|---|---|
| Markdown -> HTML | `unified` + `remark-parse` + `remark-rehype` + `rehype-stringify` |
| HTML -> Markdown | `unified` + `rehype-parse` + `rehype-remark` + `remark-stringify` |
| Markdown -> PDF | Not feasible in pure JS without a service |
| CSV -> Markdown table | Trivial, hand-roll |
| LaTeX -> HTML | `katex` (math only) or `latex.js` |
| DOCX -> HTML/Markdown | `mammoth` |
| HTML -> DOCX | Not feasible in pure JS |
| EPUB -> HTML | `epub.js` or `jszip` + custom parser |

**Tool surface:**
- `convert.markdownToHtml` - Markdown to HTML with GFM support
- `convert.htmlToMarkdown` - HTML to clean Markdown
- `convert.docxToMarkdown` - DOCX to Markdown (via mammoth)
- `convert.csvToMarkdownTable` - CSV data to Markdown table
- `convert.latexToHtml` - LaTeX to HTML (subset)

**Pros:**
- Pure npm, zero infrastructure
- Fast install, small packages
- Each conversion is well-tested in its own ecosystem
- Can be split into multiple focused tools or one umbrella tool

**Cons:**
- Doesn't cover the full pandoc format matrix
- Different libraries have different quirks and edge cases
- "Pandoc" branding is misleading if it's not actually pandoc
- No binary format output (PDF, DOCX generation)

---

## Approach 4: Sandbox-First Pandoc

Lean into the sandbox feature. If the agent has sandbox enabled, it already has `shellExec`. The tool could:

1. Check if pandoc is available in the sandbox
2. If not, install it via `shellExec` (apt-get or similar)
3. Write input content to a file via `writeFile`
4. Run pandoc via `shellExec`
5. Read output via `readFile`

**This isn't really a "tool" in the TPMJS sense** - it's more of an agent prompt/skill that orchestrates sandbox tools. But it could be packaged as a tool that detects sandbox availability and falls back gracefully.

**Tool surface:**
- `pandoc.convert` - If sandbox available, uses real pandoc. Otherwise, falls back to JS conversion for supported formats.

**Pros:**
- Real pandoc when sandbox is available
- Graceful degradation
- No extra infrastructure

**Cons:**
- Depends on sandbox being enabled
- Multi-step orchestration in a single tool call is fragile
- Installing pandoc in sandbox adds ~30s on first use
- Sandbox has 24h TTL, so pandoc install is lost on expiry

---

## Approach 5: Unsandbox Integration

Given you already have Unsandbox keys, this is interesting. Unsandbox provides cloud sandboxes with shell access.

**How it works:**
- Tool uses `UNSANDBOX_SECRET_KEY` to spin up a sandbox
- Installs pandoc in the sandbox
- Runs the conversion
- Returns the result
- Tears down (or reuses) the sandbox

**Pros:**
- Real pandoc, full format support
- No Railway service to maintain
- Unsandbox handles the container lifecycle

**Cons:**
- Adds latency (sandbox spin-up)
- Depends on Unsandbox availability and pricing
- Another API dependency
- Overkill for simple markdown -> html conversions

---

## Recommended Approach: Tiered Strategy

Combine approaches for the best coverage:

### Tier 1: `@tpmjs/tools-pandoc` (npm package, JS-native)

Ship immediately. Covers the 80% case with zero infrastructure.

```
packages/tools/official/pandoc/
  src/index.ts      # Uses unified, mammoth, etc.
```

**Tools:**
- `pandoc.convert` - Smart router that picks the best JS library for the format pair
- `pandoc.listFormats` - Returns supported format pairs
- `pandoc.markdownToHtml` - GFM Markdown to clean HTML
- `pandoc.htmlToMarkdown` - HTML to Markdown
- `pandoc.docxToMarkdown` - DOCX buffer (base64) to Markdown
- `pandoc.csvToTable` - CSV to Markdown table

Input/output is always **string-based** (or base64 for binary formats). This fits the single-shot executor model.

### Tier 2: Pandoc Service on Railway (for full format support)

Add later if users need PDF, EPUB, DOCX generation, or exotic format pairs.

- Deploy as `pandoc-service` on Railway
- The `pandoc.convert` tool detects if `PANDOC_SERVICE_URL` env var is set
- If set, routes to the service for formats JS can't handle
- If not set, returns an error explaining which formats need the service

This keeps the tool portable (works without the service for common formats) while unlocking full pandoc when configured.

### Tier 3: WASM exploration (future)

If `pandoc-wasm` matures, swap out the JS libraries for WASM. The tool's API surface stays the same, only the internals change.

---

## Implementation Sketch

```typescript
// packages/tools/official/pandoc/src/index.ts
import { tool, jsonSchema } from 'ai';

type Format = 'markdown' | 'html' | 'latex' | 'docx' | 'csv' | 'rst' | 'org';

export const convert = tool({
  description: 'Convert document content between formats (markdown, html, latex, docx, csv, rst). Supports the most common pandoc conversion pairs using native JS libraries, with optional full pandoc support via PANDOC_SERVICE_URL.',
  inputSchema: jsonSchema<{ content: string; from: Format; to: Format }>({
    type: 'object',
    properties: {
      content: { type: 'string', description: 'The document content to convert. For binary formats (docx), pass base64-encoded content.' },
      from: { type: 'string', enum: ['markdown', 'html', 'latex', 'docx', 'csv', 'rst', 'org'], description: 'Source format' },
      to: { type: 'string', enum: ['markdown', 'html', 'latex', 'docx', 'csv', 'rst', 'org'], description: 'Target format' },
    },
    required: ['content', 'from', 'to'],
    additionalProperties: false,
  }),
  async execute({ content, from, to }) {
    // 1. Check if JS-native conversion is available
    // 2. If not, check PANDOC_SERVICE_URL
    // 3. If neither, return error with supported formats
  },
});

export const listFormats = tool({
  description: 'List supported conversion format pairs and whether they use native JS or require the pandoc service.',
  inputSchema: jsonSchema<{}>({ type: 'object', properties: {}, additionalProperties: false }),
  async execute() {
    // Return matrix of supported conversions
  },
});

export default { convert, listFormats };
```

---

## Open Questions

1. **Naming**: `@tpmjs/tools-pandoc` implies pandoc compatibility. Should it be `@tpmjs/tools-docconvert` instead to avoid expectations?
2. **Binary I/O**: The executor passes params as JSON. How do we handle DOCX/PDF input/output? Base64 strings work but are 33% larger. Is there a size limit on executor payloads?
3. **Templates**: Pandoc's template system is powerful. Should we support custom templates as string input, or is that too niche?
4. **Pandoc AST**: Pandoc's intermediate JSON AST is a powerful concept. A tool that converts _to_ pandoc AST (and back) would let agents do multi-step document transformations. Worth exploring?
5. **Streaming**: Large documents could exceed the 120s timeout. Should the service support chunked conversion, or is that overengineering?
