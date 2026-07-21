# CLI surface — `@tpmjs/cli`

Discover and run registry tools from your terminal with the published [`tpm`](https://www.npmjs.com/package/@tpmjs/cli)
command line. No API key is needed to search or to run **public** tools.

## Prerequisites

- Node.js 18+
- Install the CLI globally:

```bash
npm install -g @tpmjs/cli
```

(Or run it without installing: `npx @tpmjs/cli tool search base64`.)

## 1. Discover a tool

```bash
tpm tool search base64
```

Finds tools matching `base64` in the hosted registry — including `base64EncodeTool` from the package
`@tpmjs/official-base64-encode`. See what's popular right now with:

```bash
tpm tool trending --limit 5
```

Inspect a specific tool:

```bash
tpm tool info @tpmjs/official-base64-encode base64EncodeTool
```

## 2. Execute a tool

Run the tool directly from the registry. It executes in TPMJS's hosted sandbox — nothing is installed
locally:

```bash
tpm tool execute base64EncodeTool --input '{"data":"Hello, TPMJS!"}'
```

Input can also come from a file or stdin:

```bash
tpm tool execute base64EncodeTool --input-file params.json
echo '{"data":"Hello, TPMJS!"}' | tpm tool execute base64EncodeTool
```

### Expected result

The tool base64‑encodes the string. The encoded payload is byte‑for‑byte the same result the REST
example returns (both run in the same hosted sandbox):

```json
{
  "base64": "SGVsbG8sIFRQTUpTIQ==",
  "byteLength": 13
}
```

Add `--json` for machine‑readable output you can pipe into `jq`:

```bash
tpm tool execute base64EncodeTool --input '{"data":"Hello, TPMJS!"}' --json | jq .
```

## Running a tool from a collection

If the tool lives in one of *your* collections, run it through the collection's MCP surface:

```bash
tpm run -c <user>/<collection> -t base64EncodeTool --args '{"data":"Hello, TPMJS!"}'
```

`tpm run` also accepts `--env KEY=value` for tools that need API keys, and `--json` for scripting.

## Notes / verification

- `tpm tool search` and `tpm tool trending` were verified against the live API
  (`GET https://tpmjs.com/api/tools?q=base64` and `.../api/tools/trending`) on 2026‑07‑21.
- `tpm tool execute` / `tpm run` route to the same hosted sandbox as the
  [REST example](../rest), whose exact output was verified live (see that README).
- Full command reference: <https://tpmjs.com/docs/cli> and the
  [`@tpmjs/cli` README](../../packages/cli/README.md).
