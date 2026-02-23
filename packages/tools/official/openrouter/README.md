# @tpmjs/tools-openrouter

Complete OpenRouter API tools for AI agents. 33 tools covering chat completions, embeddings, model discovery, API key management, credits, analytics, and guardrails.

## Installation

```bash
npm install @tpmjs/tools-openrouter
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENROUTER_API_KEY` | Yes | Your OpenRouter API key |
| `OPENROUTER_REFERER` | No | HTTP Referer header (default: https://tpmjs.com) |
| `OPENROUTER_TITLE` | No | X-Title header (default: TPMJS Agent) |

## Tools

### Chat & AI

| Tool | Description |
|------|-------------|
| `chatCompletion` | Send chat completions to 400+ models |
| `createResponse` | Responses API (beta) |
| `createEmbedding` | Generate text embeddings |

### Models & Discovery

| Tool | Description |
|------|-------------|
| `listModels` | List all models with pricing |
| `countModels` | Get total model count |
| `listUserModels` | Models filtered by user prefs |
| `listEmbeddingModels` | List embedding models |
| `listProviders` | List all providers |
| `listEndpoints` | Endpoints for a specific model |
| `previewZdr` | Preview ZDR impact |

### Account

| Tool | Description |
|------|-------------|
| `getCredits` | Get remaining credits |
| `createCoinbaseCharge` | Add credits via crypto |
| `getUserActivity` | Usage analytics |
| `getGeneration` | Generation metadata by ID |

### API Keys

| Tool | Description |
|------|-------------|
| `listApiKeys` | List all API keys |
| `createApiKey` | Create new key |
| `getApiKey` | Get key by hash |
| `getCurrentApiKey` | Get current key details |
| `updateApiKey` | Update key settings |
| `deleteApiKey` | Delete a key |

### Guardrails

| Tool | Description |
|------|-------------|
| `listGuardrails` | List all guardrails |
| `createGuardrail` | Create guardrail |
| `getGuardrail` | Get guardrail details |
| `updateGuardrail` | Update guardrail |
| `deleteGuardrail` | Delete guardrail |
| `listGuardrailKeyAssignments` | All key assignments |
| `listGuardrailMemberAssignments` | All member assignments |
| `getGuardrailKeys` | Keys for a guardrail |
| `assignGuardrailKeys` | Assign keys |
| `getGuardrailMembers` | Members for a guardrail |
| `assignGuardrailMembers` | Assign members |
| `unassignGuardrailKeys` | Unassign keys |
| `unassignGuardrailMembers` | Unassign members |

## Usage

```typescript
import { chatCompletion, listModels, getCredits } from '@tpmjs/tools-openrouter';

// Chat completion
const result = await chatCompletion.execute({
  model: 'openai/gpt-4o',
  messages: [{ role: 'user', content: 'Hello!' }],
});

// List models
const models = await listModels.execute({});

// Check credits
const credits = await getCredits.execute({});
```

## License

MIT
