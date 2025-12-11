# Broken Tools Classification

This document tracks the different types of tool failures encountered in the TPMJS executor and the strategies for handling them.

## Error Categories

| Error Type | Example | Root Cause | Strategy |
|------------|---------|------------|----------|
| **Invalid structure** | `fish-joke-generator`, `@tpmjs/text-transformer` | Not an AI SDK tool (missing `description` or `execute`) | Mark as BROKEN, filter from search results |
| **Module not found** | `@thomasdavis/cows@0.0.1` | Package doesn't exist on npm/esm.sh | Mark as BROKEN, consider removing from registry |
| **Factory function** | `@tavily/ai-sdk/tavilySearch` | Tool is a factory that needs config to initialize | Need to detect and call with appropriate config |
| **Missing env var** | `@exalabs/ai-sdk/webSearch` | Requires API key (e.g., `EXA_API_KEY`) not provided | Import: HEALTHY, Execution: BROKEN with clear error message |
| **Missing execution context** | `@parallel-web/ai-sdk-tools/extractTool` | Tool expects `{ abortSignal }` as 2nd arg to `execute()` | Fix executor to pass execution context |

## Detailed Examples

### Invalid Structure
```
❌ Invalid AI SDK tool structure: {
  hasDescription: false,
  hasExecute: false,
  hasInputSchema: false,
  keys: ["FishJokeSchema", "fishJoker", "createFishJoker", ...]
}
```
These packages export utility functions or schemas, not AI SDK tools.

### Module Not Found
```
❌ Failed to load tool: TypeError: Module not found "https://esm.sh/@thomasdavis/cows@0.0.1"
```
Package was registered but doesn't exist on npm or was unpublished.

### Factory Function
```
❌ Tool "tavilySearch" is a factory function but couldn't be initialized.
   Tried: no-args, config object, and single-arg patterns.
   Hint: This tool may require specific configuration. Check package documentation.
```
Tool exports a factory like `tavilySearch({ apiKey })` instead of a ready-to-use tool object.

### Missing Env Var
```
❌ EXA_API_KEY is required. Set it in environment variables or pass it in config.
```
Tool loaded successfully but execution fails without required credentials.

### Missing Execution Context
```
❌ Tool execution failed: TypeError: Cannot destructure property 'abortSignal' of 'undefined' as it is undefined.
    at Object.execute (https://esm.sh/@parallel-web/ai-sdk-tools@0.1.6/...)
```
AI SDK tools expect `execute(params, { abortSignal, ... })` but executor only passes params.

## Resolution Status

- [x] Invalid structure - Health check marks as BROKEN ✓
- [x] Module not found - Health check marks as BROKEN ✓
- [ ] Factory function - Partial support (tries common patterns)
- [x] Missing env var - Import: HEALTHY, Execution: HEALTHY (config issue, not broken)
- [x] Missing execution context - **Fixed in executor** (commit 0804f1b)
