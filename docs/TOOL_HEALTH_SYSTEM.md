# Tool Health System

This document describes how TPMJS tracks and reports tool health status, including the classification of errors and the architecture that makes this work.

## Overview

Every tool in the TPMJS registry has two health indicators:

1. **Import Health** - Can the tool be loaded from esm.sh?
2. **Execution Health** - Does the tool execute successfully?

These are stored in the database as `importHealth` and `executionHealth` with values: `UNKNOWN`, `HEALTHY`, or `BROKEN`.

## Architecture

```
┌─────────────────┐     ┌──────────────────────┐     ┌─────────────────┐
│   Playground    │────▶│   Railway Executor   │────▶│  Health API     │
│   (or any       │     │   (Deno on Railway)  │     │  /api/tools/    │
│    client)      │     │                      │     │  report-health  │
└─────────────────┘     └──────────────────────┘     └─────────────────┘
                               │                            │
                               │  Reports every             │  Classifies
                               │  execution result          │  error type
                               │                            │
                               ▼                            ▼
                        Success/Failure           HEALTHY or BROKEN
                        + error message           + stores in DB
```

### Key Design Decision: Centralized Reporting at Executor

All tool executions flow through the Railway executor, regardless of which client initiates them (playground, direct API, future CLI, etc.). This makes the executor the **single point of truth** for health reporting.

The executor reports every execution result to the centralized health API, which then determines the appropriate health status.

## Error Classification

Not all errors mean a tool is broken. The health API classifies errors into three categories:

### 1. Environment Configuration Errors → HEALTHY

These errors indicate the tool works correctly but needs API keys or configuration:

```
Pattern Examples:
- "EXA_API_KEY is required"
- "API key not provided"
- "Missing environment variable"
- "OPENAI_API_KEY must be set"
- "Please set your API key"
```

**Why HEALTHY?** The tool's code is correct. It's validating that required credentials exist, which is proper behavior. The user just needs to configure their environment.

### 2. Input Validation Errors → HEALTHY

These errors indicate the tool is correctly validating input:

```
Pattern Examples:
- "URL must have a valid domain"
- "Invalid URL format"
- "Expected string, received number"
- "Value too short"
- "Validation failed"
```

**Why HEALTHY?** The tool is working as designed. It received invalid input and correctly rejected it. This is good behavior.

### 3. Infrastructure/Code Errors → BROKEN

These are real bugs or infrastructure failures:

```
Pattern Examples:
- "Cannot read property 'foo' of undefined"
- "startTime is not defined"
- "Network request failed"
- "Module not found"
- "TypeError: x is not a function"
```

**Why BROKEN?** These indicate actual problems with the tool's code or its dependencies. Users can't fix these - the package author needs to.

## Implementation Details

### Health Reporting API

Location: `apps/web/src/app/api/tools/report-health/route.ts`

```typescript
// Error classification patterns
function isEnvironmentConfigError(error: string): boolean {
  const patterns = [
    /is required/i,
    /is not set/i,
    /missing.*environment/i,
    /api key.*required/i,
    /must be set/i,
    // ... more patterns
  ];
  return patterns.some(p => p.test(error));
}

function isInputValidationError(error: string): boolean {
  const patterns = [
    /must have a valid.*domain/i,
    /invalid.*url/i,
    /expected.*received/i,
    /validation.*failed/i,
    // ... more patterns
  ];
  return patterns.some(p => p.test(error));
}

// Classification logic
if (success) {
  healthStatus = 'HEALTHY';
} else if (error && isNonBreakingError(error)) {
  healthStatus = 'HEALTHY';  // Config/validation issue
} else {
  healthStatus = 'BROKEN';   // Real failure
}
```

### Railway Executor Health Reporting

Location: `apps/railway-executor/server.ts`

After every tool execution, the executor reports the result:

```typescript
// On successful execution
reportToolHealth(packageName, exportName, true).catch(() => {});

// On failed execution
reportToolHealth(packageName, exportName, false, error.message).catch(() => {});
```

The reporting is non-blocking (fire-and-forget) to avoid slowing down tool execution.

## Debugging Health Issues

### Common Scenarios

#### Scenario 1: Tool shows BROKEN but user says "it works for me"

The tool likely requires an API key that the previous tester didn't have. Check if the error message contains environment-related keywords. If so, the error classification patterns may need updating.

#### Scenario 2: Tool shows HEALTHY but actually crashes

The error message might be matching our "safe" patterns incorrectly. Check the actual error in `healthCheckError` field and verify our regex patterns aren't too broad.

#### Scenario 3: Tool shows BROKEN with our executor's error, not the tool's

This happened with the `startTime is not defined` bug. Our executor code had a bug that manifested before the tool even ran. Always verify the error originates from the tool's code, not our wrapper.

### Investigating a Specific Tool

```bash
# Check current health status
curl -s 'https://tpmjs.com/api/tools?limit=50' | \
  jq '.data[] | select(.package.npmPackageName == "PACKAGE_NAME") | {
    packageName: .package.npmPackageName,
    exportName: .exportName,
    importHealth: .importHealth,
    executionHealth: .executionHealth,
    healthCheckError: .healthCheckError,
    lastHealthCheck: .lastHealthCheck
  }'

# Download and inspect the package
cd /tmp && mkdir debug && cd debug
npm pack PACKAGE_NAME@VERSION
tar -xzf *.tgz
cat package/dist/index.js
```

### Manually Updating Health Status

For testing or correction:

```bash
curl -X POST 'https://tpmjs.com/api/tools/report-health' \
  -H 'Content-Type: application/json' \
  -d '{
    "packageName": "@scope/package",
    "exportName": "toolName",
    "success": true
  }'
```

## Edge Cases and Lessons Learned

### 1. Executor Bugs Masking Tool Errors

**Problem:** Our executor had `startTime` declared inside a try block but referenced in the catch block. When the tool threw an error, our catch block crashed first, showing "startTime is not defined" instead of the actual tool error.

**Lesson:** Always ensure executor error handling is bulletproof. Variables used in catch blocks must be declared before the try block.

### 2. Factory Functions Without API Keys

**Problem:** Many tools are factory functions like `webSearch({ apiKey })`. When called without the API key, they might:
- Throw immediately during factory call
- Return a tool that throws on first execution
- Return a tool that silently fails

**Lesson:** The executor tries multiple initialization strategies (no args, env object, config object) to handle various factory patterns.

### 3. esm.sh Bundling Issues

**Problem:** Some packages work locally but fail when loaded from esm.sh due to:
- Missing dependencies not properly bundled
- Node.js-specific APIs not available in Deno
- Circular dependency issues

**Lesson:** Import health and execution health are separate for a reason. A tool can import successfully but fail to execute.

### 4. Rate Limiting and Transient Failures

**Problem:** External API rate limits or temporary network issues could mark tools as BROKEN when they're actually fine.

**Current State:** We don't distinguish transient failures from permanent ones. Health status reflects the last execution only.

**Future Consideration:** Track failure frequency. A tool that fails once after 100 successes shouldn't be marked BROKEN immediately.

## Database Schema

```prisma
model Tool {
  id                String    @id @default(cuid())
  // ... other fields

  importHealth      String    @default("UNKNOWN")  // UNKNOWN, HEALTHY, BROKEN
  executionHealth   String    @default("UNKNOWN")  // UNKNOWN, HEALTHY, BROKEN
  healthCheckError  String?                        // Last error message if BROKEN
  lastHealthCheck   DateTime?                      // When health was last updated
}
```

## Adding New Error Patterns

When you encounter a new error type that should be classified as HEALTHY (not BROKEN), add it to the appropriate function in `apps/web/src/app/api/tools/report-health/route.ts`:

```typescript
// For environment/config errors
function isEnvironmentConfigError(error: string): boolean {
  const envErrorPatterns = [
    // Add new pattern here
    /your new pattern/i,
  ];
  return envErrorPatterns.some((pattern) => pattern.test(error));
}

// For input validation errors
function isInputValidationError(error: string): boolean {
  const validationErrorPatterns = [
    // Add new pattern here
    /your new pattern/i,
  ];
  return validationErrorPatterns.some((pattern) => pattern.test(error));
}
```

## Future Improvements

1. **Confidence Scores** - Track success/failure ratio over time instead of just last result
2. **Transient Failure Detection** - Distinguish network blips from real bugs
3. **Automated Retries** - Retry BROKEN tools periodically to detect fixes
4. **Error Categorization UI** - Admin interface to manually classify new error patterns
5. **Package Author Notifications** - Alert maintainers when their tools are marked BROKEN
