# @tpmjs/tool-test-utils

Test utilities for TPMJS tool packages.

## Installation

```bash
pnpm add -D @tpmjs/tool-test-utils
```

## Usage

```typescript
import { describe, it, expect } from 'vitest';
import { assertValidTool, executeTool, assertToolThrows, mockEnv } from '@tpmjs/tool-test-utils';
import { myTool } from './index.js';

describe('myTool', () => {
  it('should have valid tool structure', () => {
    assertValidTool(myTool, 'myTool');
  });

  it('should execute successfully', async () => {
    const { result, error } = await executeTool(myTool, {
      input: 'test',
    });

    expect(error).toBeUndefined();
    expect(result).toBeDefined();
    expect(result).toHaveProperty('success', true);
  });

  it('should handle errors', async () => {
    await assertToolThrows(
      myTool,
      { input: '' },
      /Input cannot be empty/
    );
  });

  it('should use environment variables', () => {
    const env = mockEnv({
      API_KEY: 'test-key',
    });

    // Test with API_KEY set
    expect(process.env.API_KEY).toBe('test-key');

    env.restore();

    // API_KEY is restored to original value
  });
});
```

## API

### assertValidTool(tool, name)

Validates that a tool has the required structure:
- Has a description (non-empty string)
- Has parameters/inputSchema
- Has an execute function

Throws an error if validation fails.

```typescript
import { assertValidTool } from '@tpmjs/tool-test-utils';

assertValidTool(myTool, 'myTool');
```

### executeTool<T>(tool, input): Promise<{result?, error?}>

Execute a tool and return the result or error. Useful for testing error cases without try/catch boilerplate.

```typescript
import { executeTool } from '@tpmjs/tool-test-utils';

const { result, error } = await executeTool(myTool, {
  message: 'Hello',
});

if (error) {
  console.error('Tool failed:', error);
} else {
  console.log('Tool result:', result);
}
```

### assertToolThrows(tool, input, errorPattern): Promise<void>

Assert that executing a tool with given input throws an error matching the pattern.

```typescript
import { assertToolThrows } from '@tpmjs/tool-test-utils';

// With string pattern (converted to RegExp)
await assertToolThrows(myTool, { invalid: true }, 'Invalid input');

// With RegExp pattern
await assertToolThrows(myTool, { invalid: true }, /Invalid.*input/);
```

### mockEnv(vars): {restore()}

Create a mock environment variable setter/restorer for tests. Values set to `undefined` delete the environment variable.

```typescript
import { mockEnv } from '@tpmjs/tool-test-utils';

const env = mockEnv({
  API_KEY: 'test-key',
  DATABASE_URL: undefined, // Deletes DATABASE_URL
});

// Test with mocked env vars
expect(process.env.API_KEY).toBe('test-key');
expect(process.env.DATABASE_URL).toBeUndefined();

// Restore original values
env.restore();
```

## Example Test Suite

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  assertValidTool,
  executeTool,
  assertToolThrows,
  mockEnv,
} from '@tpmjs/tool-test-utils';
import { queryDatabase } from './index.js';

describe('Database Tools', () => {
  let env: ReturnType<typeof mockEnv>;

  beforeEach(() => {
    env = mockEnv({
      DATABASE_URL: 'postgresql://localhost/test',
    });
  });

  afterEach(() => {
    env.restore();
  });

  describe('queryDatabase', () => {
    it('should have valid tool structure', () => {
      assertValidTool(queryDatabase, 'queryDatabase');
    });

    it('should execute query', async () => {
      const { result, error } = await executeTool(queryDatabase, {
        query: 'SELECT 1',
      });

      expect(error).toBeUndefined();
      expect(result).toBeDefined();
    });

    it('should reject invalid SQL', async () => {
      await assertToolThrows(
        queryDatabase,
        { query: 'DROP TABLE users' },
        /DROP statements are not allowed/
      );
    });

    it('should require DATABASE_URL', async () => {
      env.restore();
      mockEnv({ DATABASE_URL: undefined });

      await assertToolThrows(
        queryDatabase,
        { query: 'SELECT 1' },
        /DATABASE_URL is required/
      );
    });
  });
});
```

## License

MIT
