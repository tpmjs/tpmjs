# Blocks Domain Validator Bug Report

## Status: FIXED

The fix has been applied to `/Users/ajaxdavis/repos/blocks/packages/ai/src/provider.ts`.

---

## Summary

The domain validator in `@blocksai/validators` was failing with an OpenAI structured output schema error when validating any block. The schema and shape.ts validators worked correctly.

## Error Message

```
⚠ [domain] AI validation failed: Invalid schema for response_format 'response':
In context=('properties', 'issues', 'items'), 'required' is required to be supplied
and to be an array including every key in properties. Missing 'file'.
```

## Environment

- `@blocksai/cli`: latest (installed via npx)
- `@blocksai/validators`: latest
- OpenAI API: Using `OPENAI_API_KEY` from .env
- Node.js: v22.x
- OS: macOS

## Reproduction Steps

1. Create a valid `blocks.yml` with any block definition
2. Create the corresponding TypeScript file with proper exports
3. Run `npx blocks run --all`

## Example blocks.yml

```yaml
name: "tpmjs-official-tools"
root: "."

philosophy:
  - "Tools must be pure functions with no side effects"

domain:
  entities:
    url:
      fields: [href, domain, protocol, path]

  signals:
    credibility:
      description: "Trustworthiness of a source"

  measures:
    valid_output:
      constraints:
        - "Must return structured object matching interface"

blocks:
  domain_rules:
    - id: pure_function
      description: "Tool must be deterministic with no side effects"

  research.pageBrief:
    description: "Fetch URL and extract content"
    path: "page-brief"
    inputs:
      - name: url
        type: string
    outputs:
      - name: brief
        type: PageBrief
        measures: [valid_output]

validators:
  - schema
  - shape.ts
  - domain
```

## Observed Behavior

```
📦 Validating: research.pageBrief
  ✓ schema ok
  ✓ shape.ts ok
-   Running domain...
  ⚠ [domain] AI validation failed: Invalid schema for response_format 'response':
     In context=('properties', 'issues', 'items'), 'required' is required to be
     supplied and to be an array including every key in properties. Missing 'file'.

  ⚠️  Block "research.pageBrief" has warnings
```

## Root Cause Analysis

The error message indicates that the domain validator is constructing an OpenAI structured output request with a JSON schema that's missing required fields. Specifically:

1. OpenAI's structured output feature requires that all properties in an object schema must be listed in the `required` array
2. The domain validator's internal response schema has a `file` property in the `issues.items` object
3. This `file` property is not included in the corresponding `required` array

This is an internal schema construction issue within the domain validator, not related to user-provided blocks.yml configuration.

## Expected Behavior

The domain validator should:
1. Construct a valid JSON schema for OpenAI's structured output API
2. Ensure all properties are listed in `required` arrays
3. Successfully analyze the block against the domain rules and philosophy

## Workaround

Currently, the schema and shape.ts validators work correctly. The domain validator can be skipped by removing `domain` from the validators list in blocks.yml:

```yaml
validators:
  - schema
  - shape.ts
  # - domain  # Disabled due to bug
```

## Fix Applied

**File:** `/Users/ajaxdavis/repos/blocks/packages/ai/src/provider.ts` (lines 163-173)

**Before (broken):**
```typescript
const schema = z.object({
  isValid: z.boolean(),
  issues: z.array(
    z.object({
      message: z.string(),
      severity: z.enum(["error", "warning"]),
      file: z.string().optional(),  // ← Problem: .optional() excludes from required
    })
  ),
  summary: z.string().optional().describe("..."),
});
```

**After (fixed):**
```typescript
const schema = z.object({
  isValid: z.boolean(),
  issues: z.array(
    z.object({
      message: z.string().describe("Description of the issue found"),
      severity: z.enum(["error", "warning"]).describe("Severity of the issue"),
      file: z.string().describe("File path where the issue was found, or empty string if not file-specific"),
    })
  ),
  summary: z.string().describe("Brief summary of why the block passed or failed validation"),
});
```

**Root Cause:** OpenAI's structured output requires ALL properties to be in the JSON schema's `required` array. When Zod converts `.optional()` to JSON schema, it omits that property from `required`, causing OpenAI to reject the schema.

**Solution:** Remove `.optional()` and `.default()` modifiers. Make all fields required strings. The AI will return an empty string for file-agnostic issues.

## Impact

- **Severity**: Medium - domain validation is non-functional
- **Affected**: All blocks using the domain validator
- **Workaround available**: Yes - disable domain validator

## Additional Context

This was tested with 6 different blocks, all showing the same error. The error is consistent and reproducible regardless of block configuration.
