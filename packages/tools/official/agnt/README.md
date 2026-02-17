# @tpmjs/official-agnt

**74 production-ready AI SDK v6 tools** for the [agnt.gg](https://agnt.gg) platform and its integrations.

Manage agents, workflows, and goals on the agnt platform. Connect to Google, GitHub, Stripe, Notion, Twitter/X, YouTube, Dropbox, and more -- all through a single package with a unified interface.

[![npm](https://img.shields.io/npm/v/@tpmjs/official-agnt)](https://www.npmjs.com/package/@tpmjs/official-agnt)
[![license](https://img.shields.io/npm/l/@tpmjs/official-agnt)](https://github.com/tpmjs/tpmjs/blob/main/LICENSE)

## Installation

```bash
npm install @tpmjs/official-agnt
# or
pnpm add @tpmjs/official-agnt
```

## Quick Start

Every tool follows the [AI SDK v6](https://sdk.vercel.ai/) `tool()` pattern. Import what you need and call `.execute()`:

```typescript
import { googleSearch, chatWithAgent, generateWorkflow } from '@tpmjs/official-agnt';

// Search the web
const results = await googleSearch.execute({ query: 'latest AI research' });

// Chat with an agnt agent
const response = await chatWithAgent.execute({
  agentId: 'agent-123',
  message: 'Summarize the search results',
});

// Generate a workflow from a description
const workflow = await generateWorkflow.execute({
  description: 'Scrape a website, extract key data, and save to Google Sheets',
});
```

Use with the AI SDK's `generateText` / `streamText`:

```typescript
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { googleSearch, createIssue, sendGmail } from '@tpmjs/official-agnt';

const { text } = await generateText({
  model: openai('gpt-4o'),
  tools: { googleSearch, createIssue, sendGmail },
  prompt: 'Research the latest Node.js release and create a GitHub issue summarizing the changes.',
});
```

---

## Platform Tools

Manage agents, workflows, goals, and more on the agnt platform.

**Requires:** `AGNT_API_URL`, `AGNT_API_KEY`

### Agents

| Tool | Description |
|------|-------------|
| `listAgents` | List all agents on the platform |
| `getAgent` | Get detailed info about a specific agent |
| `createAgent` | Create a new agent with model, system prompt, and tools |
| `updateAgent` | Update an existing agent's configuration |
| `deleteAgent` | Delete an agent |
| `chatWithAgent` | Send a message to an agent and get a response |

### Workflows

| Tool | Description |
|------|-------------|
| `listWorkflows` | List all workflows |
| `getWorkflow` | Get workflow details including nodes and edges |
| `createWorkflow` | Create a new workflow with nodes and edges |
| `deleteWorkflow` | Delete a workflow |
| `startWorkflow` | Start executing a workflow |
| `stopWorkflow` | Stop a running workflow |
| `getWorkflowStatus` | Check the current status of a workflow |
| `generateWorkflow` | Generate a workflow from a natural language description |

### Goals

| Tool | Description |
|------|-------------|
| `listGoals` | List all goals on the platform |
| `createGoal` | Create a new goal with steps and optional agent assignment |
| `executeGoal` | Execute a goal |
| `getGoalStatus` | Check goal progress and status |
| `deleteGoal` | Delete a goal |

### Orchestrator & Executions

| Tool | Description |
|------|-------------|
| `generateAgent` | Generate an agent from a natural language description |
| `orchestratorChat` | Chat with the multi-agent orchestrator |
| `listExecutions` | List past executions |
| `getExecution` | Get details of a specific execution |
| `listCustomTools` | List custom tools on the platform |
| `createCustomTool` | Create a new custom tool with schema and code |
| `deleteCustomTool` | Delete a custom tool |

---

## Integration Tools

### Google Search
**Env:** `GOOGLE_SEARCH_API_KEY`, `GOOGLE_SEARCH_ENGINE_ID`

| Tool | Description |
|------|-------------|
| `googleSearch` | Search the web via Google Custom Search API |

```typescript
const results = await googleSearch.execute({
  query: 'best practices for AI agents',
  numResults: 5,
});
```

### HTTP Request
**Env:** None required

| Tool | Description |
|------|-------------|
| `httpRequest` | Make HTTP requests with configurable method, headers, auth |

```typescript
const data = await httpRequest.execute({
  url: 'https://api.example.com/data',
  method: 'GET',
  authType: 'bearer',
  authValue: 'my-token',
});
```

### OpenAI Text-to-Speech
**Env:** `OPENAI_API_KEY`

| Tool | Description |
|------|-------------|
| `textToSpeech` | Convert text to speech audio (returns base64 MP3) |

### Stripe
**Env:** `STRIPE_SECRET_KEY`

| Tool | Description |
|------|-------------|
| `createStripeInvoice` | Create, finalize, and send a Stripe invoice |

```typescript
const invoice = await createStripeInvoice.execute({
  customerEmail: 'client@example.com',
  customerName: 'Acme Corp',
  items: JSON.stringify([
    { description: 'Consulting', amount: 5000, quantity: 1 }
  ]),
});
```

### Unsplash
**Env:** `UNSPLASH_ACCESS_KEY`

| Tool | Description |
|------|-------------|
| `searchPhotos` | Search for photos by keyword |
| `getRandomPhoto` | Get a random photo, optionally filtered by query |
| `getPhoto` | Get details of a specific photo by ID |

### Firecrawl
**Env:** `FIRECRAWL_API_KEY`

| Tool | Description |
|------|-------------|
| `firecrawlScrape` | Scrape a URL and extract content as markdown or HTML |

### Zapier
**Env:** None required

| Tool | Description |
|------|-------------|
| `triggerZapierWebhook` | Send JSON data to a Zapier webhook URL |

### GitHub
**Env:** `GITHUB_TOKEN`

| Tool | Description |
|------|-------------|
| `createIssue` | Create a new issue in a repository |
| `createPullRequest` | Create a new pull request |
| `getRepoInfo` | Get repository information (stars, forks, etc.) |
| `listPullRequests` | List pull requests with filtering |
| `getFileContent` | Get the content of a file from a repo |
| `listCommits` | List recent commits |

```typescript
const issue = await createIssue.execute({
  owner: 'my-org',
  repo: 'my-repo',
  title: 'Bug: Login fails on mobile',
  body: 'Steps to reproduce...',
  labels: 'bug,mobile',
});
```

### Google Sheets
**Env:** `GOOGLE_SERVICE_ACCOUNT_KEY`

| Tool | Description |
|------|-------------|
| `readSheet` | Read data from a spreadsheet range |
| `writeSheet` | Write data to a spreadsheet range |
| `appendSheet` | Append rows to a spreadsheet |
| `clearSheet` | Clear a spreadsheet range |

### Notion
**Env:** `NOTION_API_KEY`

| Tool | Description |
|------|-------------|
| `notionSearch` | Search pages and databases |
| `notionQueryDatabase` | Query a database with filters and sorts |
| `notionGetPage` | Get a page with its content blocks |
| `notionCreatePage` | Create a new page in a database or under a parent |

### Twitter / X
**Env (reads):** `TWITTER_BEARER_TOKEN`
**Env (writes):** `TWITTER_API_KEY`, `TWITTER_API_SECRET`, `TWITTER_ACCESS_TOKEN`, `TWITTER_ACCESS_SECRET`

| Tool | Description |
|------|-------------|
| `postTweet` | Post a new tweet (supports replies) |
| `searchTweets` | Search recent tweets |
| `getUserProfile` | Get a user's profile by username |
| `getUserTweets` | Get recent tweets from a user |

### YouTube
**Env:** `YOUTUBE_API_KEY`

| Tool | Description |
|------|-------------|
| `searchVideos` | Search for videos |
| `getVideoDetails` | Get video metadata, stats, and duration |
| `listChannelVideos` | List videos from a channel |
| `getTranscript` | Get the transcript/captions of a video |

```typescript
const transcript = await getTranscript.execute({
  videoId: 'https://youtube.com/watch?v=dQw4w9WgXcQ',
});
console.log(transcript.text);
```

### Gmail
**Env:** `GOOGLE_SERVICE_ACCOUNT_KEY`, `GMAIL_USER_EMAIL`

| Tool | Description |
|------|-------------|
| `searchEmails` | Search emails using Gmail search syntax |
| `readEmail` | Read the full content of an email |
| `sendGmail` | Send an email (with optional CC/BCC) |

### Dropbox
**Env:** `DROPBOX_ACCESS_TOKEN`

| Tool | Description |
|------|-------------|
| `listFolder` | List files and folders in a directory |
| `uploadFile` | Upload a file |
| `downloadFile` | Download a file |
| `deleteFile` | Delete a file or folder |
| `createFolder` | Create a new folder |
| `createSharedLink` | Create a shared link for a file |

### Google Drive
**Env:** `GOOGLE_SERVICE_ACCOUNT_KEY`

| Tool | Description |
|------|-------------|
| `listDriveFiles` | List files in a folder |
| `uploadDriveFile` | Upload a file |
| `downloadDriveFile` | Download a file |
| `createDriveFolder` | Create a folder |
| `shareDriveFile` | Share a file with another user |

### Google Slides
**Env:** `GOOGLE_SERVICE_ACCOUNT_KEY`

| Tool | Description |
|------|-------------|
| `createPresentation` | Create a new presentation |
| `getPresentation` | Get presentation info and slide list |
| `addSlide` | Add a slide with title and body text |

---

## Environment Variables

Each integration requires its own credentials. Only set the ones you need:

| Variable | Used By |
|----------|---------|
| `AGNT_API_URL` | Platform tools |
| `AGNT_API_KEY` | Platform tools |
| `GOOGLE_SEARCH_API_KEY` | Google Search |
| `GOOGLE_SEARCH_ENGINE_ID` | Google Search |
| `OPENAI_API_KEY` | Text-to-Speech |
| `STRIPE_SECRET_KEY` | Stripe |
| `UNSPLASH_ACCESS_KEY` | Unsplash |
| `FIRECRAWL_API_KEY` | Firecrawl |
| `GITHUB_TOKEN` | GitHub |
| `GOOGLE_SERVICE_ACCOUNT_KEY` | Sheets, Drive, Slides, Gmail |
| `GMAIL_USER_EMAIL` | Gmail |
| `NOTION_API_KEY` | Notion |
| `TWITTER_BEARER_TOKEN` | Twitter (reads) |
| `TWITTER_API_KEY` | Twitter (writes) |
| `TWITTER_API_SECRET` | Twitter (writes) |
| `TWITTER_ACCESS_TOKEN` | Twitter (writes) |
| `TWITTER_ACCESS_SECRET` | Twitter (writes) |
| `YOUTUBE_API_KEY` | YouTube |
| `DROPBOX_ACCESS_TOKEN` | Dropbox |

## TypeScript

All input and output types are exported:

```typescript
import type {
  AgntAgent,
  AgntWorkflow,
  GoogleSearchResult,
  CreateIssueResult,
  TranscriptResult,
} from '@tpmjs/official-agnt';
```

## License

MIT
