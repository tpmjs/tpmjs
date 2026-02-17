# @tpmjs/tools-jq

jq JSON processing tools for AI agents. Query, filter, and format JSON data using jq expressions.

## Requirements

The `jq` binary must be available in the system PATH. The TPMJS executor Docker image includes it.

## Tools

- **query** — Run a jq expression on JSON input
- **format** — Pretty-print JSON

## Usage

```typescript
import { query, format } from '@tpmjs/tools-jq';
```
