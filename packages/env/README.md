# @tpmjs/env

Type-safe environment variable validation for [TPMJS](https://tpmjs.com), powered by [Zod](https://zod.dev).

[![npm version](https://img.shields.io/npm/v/@tpmjs/env.svg)](https://www.npmjs.com/package/@tpmjs/env)
[![License: MIT](https://img.shields.io/github/license/tpmjs/tpmjs)](https://github.com/tpmjs/tpmjs/blob/main/LICENSE)

A single-function helper used across the TPMJS services to validate `process.env` against a Zod schema at startup. It fails fast with a clear (secret-redacted) error listing exactly which variables are missing or malformed, and returns a fully typed config object. Empty-string variables are treated as unset so `.optional()` behaves as expected.

## Installation

```bash
npm install @tpmjs/env
```

## Usage

```typescript
import { createEnv } from '@tpmjs/env';
import { z } from 'zod';

export const env = createEnv({
  DATABASE_URL: z.string().url(),
  PORT: z.coerce.number().default(3000),
  API_KEY: z.string().min(1),
  DEBUG: z.string().optional(),
});

// Fully typed — env.PORT is number, env.API_KEY is string
console.log(env.DATABASE_URL);
```

On invalid input `createEnv` logs the failing keys (values truncated to their first 4 characters) and throws:

```
[createEnv] Invalid environment variables: API_KEY {"API_KEY":["String must contain at least 1 character(s)"]}
Error: Invalid environment variables: API_KEY
```

## API

- `createEnv<T extends Record<string, z.ZodTypeAny>>(schema: T): z.infer<z.ZodObject<T>>` — validate `process.env` against the given schema shape. Reads only the keys present in `schema`, converts empty strings to `undefined`, and returns the parsed, typed values. Throws on any validation failure.

## Links

- Repository: [github.com/tpmjs/tpmjs](https://github.com/tpmjs/tpmjs) (`packages/env`)
- Website: [tpmjs.com](https://tpmjs.com)

## License

MIT
