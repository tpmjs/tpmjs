# @tpmjs/tools-github

GitHub API tools for AI agents. Manage repos, issues, pull requests, commits, branches, releases, gists, and Actions workflows.

## Installation

```bash
npm install @tpmjs/tools-github
```

## Setup

Set your GitHub personal access token:

```bash
export GITHUB_TOKEN="ghp_..."
```

## Usage

```typescript
import { getRepo, listIssues, searchCode } from '@tpmjs/tools-github';

const repo = await getRepo.execute({ owner: 'vercel', repo: 'next.js' });
const issues = await listIssues.execute({ owner: 'vercel', repo: 'next.js', state: 'open', per_page: 5 });
const results = await searchCode.execute({ q: 'useState language:typescript', per_page: 10 });
```

## Tools

| Tool | Description |
|------|-------------|
| `getRepo` | Get details of a GitHub repository |
| `listRepos` | List repositories for a user or organization |
| `searchRepositories` | Search GitHub repositories by query |
| `createIssue` | Create a new issue on a repository |
| `getIssue` | Get details of a specific issue |
| `listIssues` | List issues with state and label filters |
| `createIssueComment` | Add a comment to an issue or PR |
| `getPullRequest` | Get details of a specific pull request |
| `listPullRequests` | List pull requests with filters |
| `getFileContent` | Get file or directory contents from a repo |
| `searchCode` | Search for code across GitHub |
| `listBranches` | List branches on a repository |
| `getCommit` | Get details of a specific commit |
| `listCommits` | List commits with path and author filters |
| `listReleases` | List releases on a repository |
| `getRelease` | Get a specific release by tag name |
| `createGist` | Create a new GitHub Gist |
| `listGists` | List gists for a user |
| `listWorkflowRuns` | List GitHub Actions workflow runs |
| `getWorkflowRun` | Get details of a workflow run |

## License

MIT
