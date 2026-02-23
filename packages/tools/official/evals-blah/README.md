# @tpmjs/tools-evals-blah

AI SDK tools for [evals.blah.dev](https://evals.blah.dev) — the open LLM evaluation platform. Register models, create evals, trigger runs, and check the leaderboard.

## Installation

```bash
npm install @tpmjs/tools-evals-blah
```

## Setup

Read-only tools (list, get, leaderboard) require no authentication.

For write operations (create model, create eval, trigger run), set your API key:

```bash
export EVALS_BLAH_API_KEY=blah_your_api_key_here
```

Get an API key at https://evals.blah.dev/settings/api-keys

## Usage

```typescript
import {
  listModels,
  getLeaderboard,
  createModel,
  createEval,
  triggerRun,
} from '@tpmjs/tools-evals-blah';

// List all models (no auth needed)
const models = await listModels.execute({});

// Check the leaderboard (no auth needed)
const leaderboard = await getLeaderboard.execute({});

// Register a model (requires API key)
const model = await createModel.execute({
  name: 'My Model',
  inference_uri: 'openai/gpt-4.1-mini',
});

// Create an eval (requires API key)
const eval = await createEval.execute({
  name: 'Code Clarity',
  prompt: 'Write a function to reverse a string',
  eval_type: 'rubric',
  eval_criteria: '{"rubric": "Rate code clarity 0-1", "max_score": 1}',
});

// Trigger a run (requires API key)
const run = await triggerRun.execute({});
```

## Tools

| Tool | Auth | Description |
|------|------|-------------|
| `listModels` | No | List all registered LLM models |
| `getModel` | No | Get a model by ID |
| `createModel` | Yes | Register a new model |
| `getModelResults` | No | Get all eval results for a model |
| `listEvals` | No | List all evaluation definitions |
| `getEval` | No | Get an eval by ID |
| `createEval` | Yes | Create a new evaluation |
| `listRuns` | No | List all eval runs |
| `getRun` | No | Get a run by ID |
| `getRunResults` | No | Get all results for a run |
| `triggerRun` | Yes | Trigger a new eval run |
| `getResult` | No | Get a single result by ID |
| `getLeaderboard` | No | Get model rankings |

## License

MIT
