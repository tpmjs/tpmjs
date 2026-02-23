/**
 * @tpmjs/tools-github — GitHub API Tools for AI Agents
 *
 * Full access to the GitHub REST API: repos, issues, pull requests, commits,
 * releases, gists, workflow runs, and code search.
 *
 * @requires GITHUB_TOKEN environment variable
 */

import { jsonSchema, tool } from 'ai';

const BASE_URL = 'https://api.github.com';

// ─── Client Infrastructure ──────────────────────────────────────────────────

function getApiKey(): string {
  const key = process.env.GITHUB_TOKEN;
  if (!key) {
    throw new Error(
      'GITHUB_TOKEN environment variable is required. Get your token from https://github.com/settings/tokens'
    );
  }
  return key;
}

async function apiRequest<T>(method: string, path: string, body?: unknown): Promise<T> {
  const key = getApiKey();

  const headers: Record<string, string> = {
    Authorization: `Bearer ${key}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-API-Version': '2022-11-28',
    'Content-Type': 'application/json',
  };

  const options: RequestInit = { method, headers };
  if (body !== undefined) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${BASE_URL}${path}`, options);

  if (!response.ok) {
    await handleApiError(response);
  }

  const text = await response.text();
  if (!text) {
    return {} as T;
  }

  return JSON.parse(text) as T;
}

async function handleApiError(response: Response): Promise<never> {
  let errorMessage: string;
  try {
    const errorData = (await response.json()) as { message?: string; error?: string };
    errorMessage = errorData.message || errorData.error || `HTTP ${response.status}`;
  } catch {
    errorMessage = `HTTP ${response.status}: ${response.statusText}`;
  }

  switch (response.status) {
    case 400:
      throw new Error(`Bad request: ${errorMessage}`);
    case 401:
      throw new Error('Authentication failed: Invalid GitHub token. Check GITHUB_TOKEN.');
    case 403:
      throw new Error(`Access forbidden: ${errorMessage}`);
    case 404:
      throw new Error(`Not found: ${errorMessage}`);
    case 422:
      throw new Error(`Validation error: ${errorMessage}`);
    case 429:
      throw new Error(`Rate limit exceeded: ${errorMessage}`);
    default:
      throw new Error(`GitHub API error (${response.status}): ${errorMessage}`);
  }
}

function buildQueryString(params: Record<string, unknown>): string {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== ''
  );
  if (entries.length === 0) return '';
  return (
    '?' +
    entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`).join('&')
  );
}

// ─── Repositories ───────────────────────────────────────────────────────────

export interface GetRepoInput {
  owner: string;
  repo: string;
}

export const getRepo = tool({
  description:
    'Get detailed information about a GitHub repository including description, stars, forks, and topics.',
  inputSchema: jsonSchema<GetRepoInput>({
    type: 'object',
    properties: {
      owner: { type: 'string', description: 'Repository owner (username or organization).' },
      repo: { type: 'string', description: 'Repository name.' },
    },
    required: ['owner', 'repo'],
    additionalProperties: false,
  }),
  async execute(input: GetRepoInput) {
    try {
      if (!input.owner || !input.repo) {
        throw new Error('Owner and repo are required');
      }
      return await apiRequest<Record<string, unknown>>(
        'GET',
        `/repos/${input.owner}/${input.repo}`
      );
    } catch (error) {
      throw new Error(`Failed to get repository: ${(error as Error).message}`);
    }
  },
});

export interface ListReposInput {
  username: string;
  sort?: string;
  direction?: string;
  per_page?: number;
}

export const listRepos = tool({
  description:
    'List public repositories for a specified user with optional sorting and pagination.',
  inputSchema: jsonSchema<ListReposInput>({
    type: 'object',
    properties: {
      username: { type: 'string', description: 'GitHub username to list repositories for.' },
      sort: {
        type: 'string',
        description: 'Sort by: created, updated, pushed, full_name (default: full_name).',
      },
      direction: { type: 'string', description: 'Sort direction: asc or desc (default: asc).' },
      per_page: { type: 'number', description: 'Results per page (1-100, default: 30).' },
    },
    required: ['username'],
    additionalProperties: false,
  }),
  async execute(input: ListReposInput) {
    try {
      if (!input.username) {
        throw new Error('Username is required');
      }
      const qs = buildQueryString({
        sort: input.sort,
        direction: input.direction,
        per_page: input.per_page,
      });
      return await apiRequest<unknown[]>('GET', `/users/${input.username}/repos${qs}`);
    } catch (error) {
      throw new Error(`Failed to list repositories: ${(error as Error).message}`);
    }
  },
});

export interface SearchRepositoriesInput {
  q: string;
  sort?: string;
  order?: string;
  per_page?: number;
}

export const searchRepositories = tool({
  description:
    'Search for GitHub repositories by keyword, language, stars, or other criteria using GitHub search syntax.',
  inputSchema: jsonSchema<SearchRepositoriesInput>({
    type: 'object',
    properties: {
      q: {
        type: 'string',
        description:
          'Search query (e.g., "react language:typescript stars:>1000"). See GitHub search syntax.',
      },
      sort: {
        type: 'string',
        description: 'Sort by: stars, forks, help-wanted-issues, updated (default: best match).',
      },
      order: { type: 'string', description: 'Sort order: asc or desc (default: desc).' },
      per_page: { type: 'number', description: 'Results per page (1-100, default: 30).' },
    },
    required: ['q'],
    additionalProperties: false,
  }),
  async execute(input: SearchRepositoriesInput) {
    try {
      if (!input.q) {
        throw new Error('Search query is required');
      }
      const qs = buildQueryString({
        q: input.q,
        sort: input.sort,
        order: input.order,
        per_page: input.per_page,
      });
      return await apiRequest<Record<string, unknown>>('GET', `/search/repositories${qs}`);
    } catch (error) {
      throw new Error(`Failed to search repositories: ${(error as Error).message}`);
    }
  },
});

// ─── Issues ─────────────────────────────────────────────────────────────────

export interface CreateIssueInput {
  owner: string;
  repo: string;
  title: string;
  body?: string;
  labels?: string[];
  assignees?: string[];
}

export const createIssue = tool({
  description: 'Create a new issue in a GitHub repository with title, body, labels, and assignees.',
  inputSchema: jsonSchema<CreateIssueInput>({
    type: 'object',
    properties: {
      owner: { type: 'string', description: 'Repository owner.' },
      repo: { type: 'string', description: 'Repository name.' },
      title: { type: 'string', description: 'Issue title.' },
      body: { type: 'string', description: 'Issue body content (supports Markdown).' },
      labels: {
        type: 'array',
        items: { type: 'string' },
        description: 'Array of label names to add to the issue.',
      },
      assignees: {
        type: 'array',
        items: { type: 'string' },
        description: 'Array of GitHub usernames to assign to the issue.',
      },
    },
    required: ['owner', 'repo', 'title'],
    additionalProperties: false,
  }),
  async execute(input: CreateIssueInput) {
    try {
      if (!input.owner || !input.repo || !input.title) {
        throw new Error('Owner, repo, and title are required');
      }
      return await apiRequest<Record<string, unknown>>(
        'POST',
        `/repos/${input.owner}/${input.repo}/issues`,
        {
          title: input.title,
          body: input.body,
          labels: input.labels,
          assignees: input.assignees,
        }
      );
    } catch (error) {
      throw new Error(`Failed to create issue: ${(error as Error).message}`);
    }
  },
});

export interface GetIssueInput {
  owner: string;
  repo: string;
  issue_number: number;
}

export const getIssue = tool({
  description: 'Get details of a specific issue by its number including comments count and state.',
  inputSchema: jsonSchema<GetIssueInput>({
    type: 'object',
    properties: {
      owner: { type: 'string', description: 'Repository owner.' },
      repo: { type: 'string', description: 'Repository name.' },
      issue_number: { type: 'number', description: 'Issue number.' },
    },
    required: ['owner', 'repo', 'issue_number'],
    additionalProperties: false,
  }),
  async execute(input: GetIssueInput) {
    try {
      if (!input.owner || !input.repo || !input.issue_number) {
        throw new Error('Owner, repo, and issue_number are required');
      }
      return await apiRequest<Record<string, unknown>>(
        'GET',
        `/repos/${input.owner}/${input.repo}/issues/${input.issue_number}`
      );
    } catch (error) {
      throw new Error(`Failed to get issue: ${(error as Error).message}`);
    }
  },
});

export interface ListIssuesInput {
  owner: string;
  repo: string;
  state?: string;
  labels?: string;
  sort?: string;
  per_page?: number;
}

export const listIssues = tool({
  description:
    'List issues for a repository with optional filtering by state, labels, and sorting options.',
  inputSchema: jsonSchema<ListIssuesInput>({
    type: 'object',
    properties: {
      owner: { type: 'string', description: 'Repository owner.' },
      repo: { type: 'string', description: 'Repository name.' },
      state: {
        type: 'string',
        description: 'Filter by state: open, closed, or all (default: open).',
      },
      labels: {
        type: 'string',
        description: 'Comma-separated list of label names to filter by.',
      },
      sort: {
        type: 'string',
        description: 'Sort by: created, updated, comments (default: created).',
      },
      per_page: { type: 'number', description: 'Results per page (1-100, default: 30).' },
    },
    required: ['owner', 'repo'],
    additionalProperties: false,
  }),
  async execute(input: ListIssuesInput) {
    try {
      if (!input.owner || !input.repo) {
        throw new Error('Owner and repo are required');
      }
      const qs = buildQueryString({
        state: input.state,
        labels: input.labels,
        sort: input.sort,
        per_page: input.per_page,
      });
      return await apiRequest<unknown[]>('GET', `/repos/${input.owner}/${input.repo}/issues${qs}`);
    } catch (error) {
      throw new Error(`Failed to list issues: ${(error as Error).message}`);
    }
  },
});

export interface CreateIssueCommentInput {
  owner: string;
  repo: string;
  issue_number: number;
  body: string;
}

export const createIssueComment = tool({
  description: 'Add a comment to an existing issue with Markdown-formatted content.',
  inputSchema: jsonSchema<CreateIssueCommentInput>({
    type: 'object',
    properties: {
      owner: { type: 'string', description: 'Repository owner.' },
      repo: { type: 'string', description: 'Repository name.' },
      issue_number: { type: 'number', description: 'Issue number to comment on.' },
      body: { type: 'string', description: 'Comment body (supports Markdown).' },
    },
    required: ['owner', 'repo', 'issue_number', 'body'],
    additionalProperties: false,
  }),
  async execute(input: CreateIssueCommentInput) {
    try {
      if (!input.owner || !input.repo || !input.issue_number || !input.body) {
        throw new Error('Owner, repo, issue_number, and body are required');
      }
      return await apiRequest<Record<string, unknown>>(
        'POST',
        `/repos/${input.owner}/${input.repo}/issues/${input.issue_number}/comments`,
        { body: input.body }
      );
    } catch (error) {
      throw new Error(`Failed to create issue comment: ${(error as Error).message}`);
    }
  },
});

// ─── Pull Requests ──────────────────────────────────────────────────────────

export interface GetPullRequestInput {
  owner: string;
  repo: string;
  pull_number: number;
}

export const getPullRequest = tool({
  description:
    'Get details of a specific pull request including mergeable state, review status, and commits.',
  inputSchema: jsonSchema<GetPullRequestInput>({
    type: 'object',
    properties: {
      owner: { type: 'string', description: 'Repository owner.' },
      repo: { type: 'string', description: 'Repository name.' },
      pull_number: { type: 'number', description: 'Pull request number.' },
    },
    required: ['owner', 'repo', 'pull_number'],
    additionalProperties: false,
  }),
  async execute(input: GetPullRequestInput) {
    try {
      if (!input.owner || !input.repo || !input.pull_number) {
        throw new Error('Owner, repo, and pull_number are required');
      }
      return await apiRequest<Record<string, unknown>>(
        'GET',
        `/repos/${input.owner}/${input.repo}/pulls/${input.pull_number}`
      );
    } catch (error) {
      throw new Error(`Failed to get pull request: ${(error as Error).message}`);
    }
  },
});

export interface ListPullRequestsInput {
  owner: string;
  repo: string;
  state?: string;
  head?: string;
  base?: string;
  sort?: string;
  per_page?: number;
}

export const listPullRequests = tool({
  description:
    'List pull requests for a repository with optional filtering by state, branch, and sorting.',
  inputSchema: jsonSchema<ListPullRequestsInput>({
    type: 'object',
    properties: {
      owner: { type: 'string', description: 'Repository owner.' },
      repo: { type: 'string', description: 'Repository name.' },
      state: {
        type: 'string',
        description: 'Filter by state: open, closed, or all (default: open).',
      },
      head: {
        type: 'string',
        description: 'Filter by head branch (format: user:ref-name or organization:ref-name).',
      },
      base: { type: 'string', description: 'Filter by base branch name.' },
      sort: {
        type: 'string',
        description: 'Sort by: created, updated, popularity, long-running (default: created).',
      },
      per_page: { type: 'number', description: 'Results per page (1-100, default: 30).' },
    },
    required: ['owner', 'repo'],
    additionalProperties: false,
  }),
  async execute(input: ListPullRequestsInput) {
    try {
      if (!input.owner || !input.repo) {
        throw new Error('Owner and repo are required');
      }
      const qs = buildQueryString({
        state: input.state,
        head: input.head,
        base: input.base,
        sort: input.sort,
        per_page: input.per_page,
      });
      return await apiRequest<unknown[]>('GET', `/repos/${input.owner}/${input.repo}/pulls${qs}`);
    } catch (error) {
      throw new Error(`Failed to list pull requests: ${(error as Error).message}`);
    }
  },
});

// ─── Content ────────────────────────────────────────────────────────────────

export interface GetFileContentInput {
  owner: string;
  repo: string;
  path: string;
  ref?: string;
}

export const getFileContent = tool({
  description:
    'Get the contents of a file or directory in a repository at a specific ref (branch, tag, or commit SHA).',
  inputSchema: jsonSchema<GetFileContentInput>({
    type: 'object',
    properties: {
      owner: { type: 'string', description: 'Repository owner.' },
      repo: { type: 'string', description: 'Repository name.' },
      path: { type: 'string', description: 'File or directory path within the repository.' },
      ref: {
        type: 'string',
        description: 'Git ref (branch name, tag, or commit SHA). Defaults to default branch.',
      },
    },
    required: ['owner', 'repo', 'path'],
    additionalProperties: false,
  }),
  async execute(input: GetFileContentInput) {
    try {
      if (!input.owner || !input.repo || !input.path) {
        throw new Error('Owner, repo, and path are required');
      }
      const qs = buildQueryString({ ref: input.ref });
      return await apiRequest<Record<string, unknown>>(
        'GET',
        `/repos/${input.owner}/${input.repo}/contents/${input.path}${qs}`
      );
    } catch (error) {
      throw new Error(`Failed to get file content: ${(error as Error).message}`);
    }
  },
});

export interface SearchCodeInput {
  q: string;
  sort?: string;
  order?: string;
  per_page?: number;
}

export const searchCode = tool({
  description:
    'Search for code across all GitHub repositories using keyword, filename, language, or other filters.',
  inputSchema: jsonSchema<SearchCodeInput>({
    type: 'object',
    properties: {
      q: {
        type: 'string',
        description:
          'Search query (e.g., "addClass in:file language:js repo:jquery/jquery"). See GitHub search syntax.',
      },
      sort: { type: 'string', description: 'Sort by: indexed (default: best match).' },
      order: { type: 'string', description: 'Sort order: asc or desc (default: desc).' },
      per_page: { type: 'number', description: 'Results per page (1-100, default: 30).' },
    },
    required: ['q'],
    additionalProperties: false,
  }),
  async execute(input: SearchCodeInput) {
    try {
      if (!input.q) {
        throw new Error('Search query is required');
      }
      const qs = buildQueryString({
        q: input.q,
        sort: input.sort,
        order: input.order,
        per_page: input.per_page,
      });
      return await apiRequest<Record<string, unknown>>('GET', `/search/code${qs}`);
    } catch (error) {
      throw new Error(`Failed to search code: ${(error as Error).message}`);
    }
  },
});

// ─── Branches & Commits ─────────────────────────────────────────────────────

export interface ListBranchesInput {
  owner: string;
  repo: string;
  per_page?: number;
}

export const listBranches = tool({
  description:
    'List all branches in a repository with their latest commit SHA and protection status.',
  inputSchema: jsonSchema<ListBranchesInput>({
    type: 'object',
    properties: {
      owner: { type: 'string', description: 'Repository owner.' },
      repo: { type: 'string', description: 'Repository name.' },
      per_page: { type: 'number', description: 'Results per page (1-100, default: 30).' },
    },
    required: ['owner', 'repo'],
    additionalProperties: false,
  }),
  async execute(input: ListBranchesInput) {
    try {
      if (!input.owner || !input.repo) {
        throw new Error('Owner and repo are required');
      }
      const qs = buildQueryString({ per_page: input.per_page });
      return await apiRequest<unknown[]>(
        'GET',
        `/repos/${input.owner}/${input.repo}/branches${qs}`
      );
    } catch (error) {
      throw new Error(`Failed to list branches: ${(error as Error).message}`);
    }
  },
});

export interface GetCommitInput {
  owner: string;
  repo: string;
  ref: string;
}

export const getCommit = tool({
  description:
    'Get detailed information about a specific commit including changes, author, and committer.',
  inputSchema: jsonSchema<GetCommitInput>({
    type: 'object',
    properties: {
      owner: { type: 'string', description: 'Repository owner.' },
      repo: { type: 'string', description: 'Repository name.' },
      ref: { type: 'string', description: 'Commit SHA, branch name, or tag.' },
    },
    required: ['owner', 'repo', 'ref'],
    additionalProperties: false,
  }),
  async execute(input: GetCommitInput) {
    try {
      if (!input.owner || !input.repo || !input.ref) {
        throw new Error('Owner, repo, and ref are required');
      }
      return await apiRequest<Record<string, unknown>>(
        'GET',
        `/repos/${input.owner}/${input.repo}/commits/${input.ref}`
      );
    } catch (error) {
      throw new Error(`Failed to get commit: ${(error as Error).message}`);
    }
  },
});

export interface ListCommitsInput {
  owner: string;
  repo: string;
  sha?: string;
  path?: string;
  author?: string;
  since?: string;
  until?: string;
  per_page?: number;
}

export const listCommits = tool({
  description:
    'List commits in a repository with optional filtering by branch, path, author, and date range.',
  inputSchema: jsonSchema<ListCommitsInput>({
    type: 'object',
    properties: {
      owner: { type: 'string', description: 'Repository owner.' },
      repo: { type: 'string', description: 'Repository name.' },
      sha: {
        type: 'string',
        description: 'SHA or branch to start listing from (defaults to default branch).',
      },
      path: { type: 'string', description: 'Only commits containing this file path.' },
      author: { type: 'string', description: 'GitHub username or email to filter by author.' },
      since: {
        type: 'string',
        description: 'Only commits after this date (ISO 8601 timestamp).',
      },
      until: {
        type: 'string',
        description: 'Only commits before this date (ISO 8601 timestamp).',
      },
      per_page: { type: 'number', description: 'Results per page (1-100, default: 30).' },
    },
    required: ['owner', 'repo'],
    additionalProperties: false,
  }),
  async execute(input: ListCommitsInput) {
    try {
      if (!input.owner || !input.repo) {
        throw new Error('Owner and repo are required');
      }
      const qs = buildQueryString({
        sha: input.sha,
        path: input.path,
        author: input.author,
        since: input.since,
        until: input.until,
        per_page: input.per_page,
      });
      return await apiRequest<unknown[]>('GET', `/repos/${input.owner}/${input.repo}/commits${qs}`);
    } catch (error) {
      throw new Error(`Failed to list commits: ${(error as Error).message}`);
    }
  },
});

// ─── Releases ───────────────────────────────────────────────────────────────

export interface ListReleasesInput {
  owner: string;
  repo: string;
  per_page?: number;
}

export const listReleases = tool({
  description:
    'List published releases for a repository including tags, assets, and release notes.',
  inputSchema: jsonSchema<ListReleasesInput>({
    type: 'object',
    properties: {
      owner: { type: 'string', description: 'Repository owner.' },
      repo: { type: 'string', description: 'Repository name.' },
      per_page: { type: 'number', description: 'Results per page (1-100, default: 30).' },
    },
    required: ['owner', 'repo'],
    additionalProperties: false,
  }),
  async execute(input: ListReleasesInput) {
    try {
      if (!input.owner || !input.repo) {
        throw new Error('Owner and repo are required');
      }
      const qs = buildQueryString({ per_page: input.per_page });
      return await apiRequest<unknown[]>(
        'GET',
        `/repos/${input.owner}/${input.repo}/releases${qs}`
      );
    } catch (error) {
      throw new Error(`Failed to list releases: ${(error as Error).message}`);
    }
  },
});

export interface GetReleaseInput {
  owner: string;
  repo: string;
  tag: string;
}

export const getRelease = tool({
  description: 'Get details of a specific release by its tag name including assets and body.',
  inputSchema: jsonSchema<GetReleaseInput>({
    type: 'object',
    properties: {
      owner: { type: 'string', description: 'Repository owner.' },
      repo: { type: 'string', description: 'Repository name.' },
      tag: { type: 'string', description: 'Release tag name (e.g., "v1.0.0").' },
    },
    required: ['owner', 'repo', 'tag'],
    additionalProperties: false,
  }),
  async execute(input: GetReleaseInput) {
    try {
      if (!input.owner || !input.repo || !input.tag) {
        throw new Error('Owner, repo, and tag are required');
      }
      return await apiRequest<Record<string, unknown>>(
        'GET',
        `/repos/${input.owner}/${input.repo}/releases/tags/${input.tag}`
      );
    } catch (error) {
      throw new Error(`Failed to get release: ${(error as Error).message}`);
    }
  },
});

// ─── Gists ──────────────────────────────────────────────────────────────────

export interface CreateGistInput {
  description?: string;
  files: Record<string, { content: string }>;
  public?: boolean;
}

export const createGist = tool({
  description:
    'Create a new gist with one or more files. Gists can be public or secret (unlisted).',
  inputSchema: jsonSchema<CreateGistInput>({
    type: 'object',
    properties: {
      description: { type: 'string', description: 'Description of the gist.' },
      files: {
        type: 'object',
        additionalProperties: {
          type: 'object',
          properties: {
            content: { type: 'string', description: 'File content.' },
          },
          required: ['content'],
        },
        description:
          'Files to include in the gist as an object with filename keys and { content } values.',
      },
      public: {
        type: 'boolean',
        description: 'Whether the gist is public (true) or secret/unlisted (false).',
      },
    },
    required: ['files'],
    additionalProperties: false,
  }),
  async execute(input: CreateGistInput) {
    try {
      if (!input.files || Object.keys(input.files).length === 0) {
        throw new Error('At least one file is required');
      }
      return await apiRequest<Record<string, unknown>>('POST', '/gists', {
        description: input.description,
        files: input.files,
        public: input.public ?? true,
      });
    } catch (error) {
      throw new Error(`Failed to create gist: ${(error as Error).message}`);
    }
  },
});

export interface ListGistsInput {
  username?: string;
  per_page?: number;
}

export const listGists = tool({
  description:
    'List public gists for a specified user, or list all public gists if no username provided.',
  inputSchema: jsonSchema<ListGistsInput>({
    type: 'object',
    properties: {
      username: {
        type: 'string',
        description: 'GitHub username to list gists for. Omit to list all public gists.',
      },
      per_page: { type: 'number', description: 'Results per page (1-100, default: 30).' },
    },
    additionalProperties: false,
  }),
  async execute(input: ListGistsInput) {
    try {
      const qs = buildQueryString({ per_page: input.per_page });
      const path = input.username ? `/users/${input.username}/gists${qs}` : `/gists${qs}`;
      return await apiRequest<unknown[]>('GET', path);
    } catch (error) {
      throw new Error(`Failed to list gists: ${(error as Error).message}`);
    }
  },
});

// ─── Actions ────────────────────────────────────────────────────────────────

export interface ListWorkflowRunsInput {
  owner: string;
  repo: string;
  status?: string;
  per_page?: number;
}

export const listWorkflowRuns = tool({
  description:
    'List GitHub Actions workflow runs for a repository with optional filtering by status.',
  inputSchema: jsonSchema<ListWorkflowRunsInput>({
    type: 'object',
    properties: {
      owner: { type: 'string', description: 'Repository owner.' },
      repo: { type: 'string', description: 'Repository name.' },
      status: {
        type: 'string',
        description:
          'Filter by status: completed, action_required, cancelled, failure, neutral, skipped, stale, success, timed_out, in_progress, queued, requested, waiting.',
      },
      per_page: { type: 'number', description: 'Results per page (1-100, default: 30).' },
    },
    required: ['owner', 'repo'],
    additionalProperties: false,
  }),
  async execute(input: ListWorkflowRunsInput) {
    try {
      if (!input.owner || !input.repo) {
        throw new Error('Owner and repo are required');
      }
      const qs = buildQueryString({ status: input.status, per_page: input.per_page });
      return await apiRequest<Record<string, unknown>>(
        'GET',
        `/repos/${input.owner}/${input.repo}/actions/runs${qs}`
      );
    } catch (error) {
      throw new Error(`Failed to list workflow runs: ${(error as Error).message}`);
    }
  },
});

export interface GetWorkflowRunInput {
  owner: string;
  repo: string;
  run_id: number;
}

export const getWorkflowRun = tool({
  description:
    'Get details of a specific workflow run including status, conclusion, and job information.',
  inputSchema: jsonSchema<GetWorkflowRunInput>({
    type: 'object',
    properties: {
      owner: { type: 'string', description: 'Repository owner.' },
      repo: { type: 'string', description: 'Repository name.' },
      run_id: { type: 'number', description: 'Workflow run ID.' },
    },
    required: ['owner', 'repo', 'run_id'],
    additionalProperties: false,
  }),
  async execute(input: GetWorkflowRunInput) {
    try {
      if (!input.owner || !input.repo || !input.run_id) {
        throw new Error('Owner, repo, and run_id are required');
      }
      return await apiRequest<Record<string, unknown>>(
        'GET',
        `/repos/${input.owner}/${input.repo}/actions/runs/${input.run_id}`
      );
    } catch (error) {
      throw new Error(`Failed to get workflow run: ${(error as Error).message}`);
    }
  },
});

// ─── Default Export ─────────────────────────────────────────────────────────

export default {
  // Repositories
  getRepo,
  listRepos,
  searchRepositories,
  // Issues
  createIssue,
  getIssue,
  listIssues,
  createIssueComment,
  // Pull Requests
  getPullRequest,
  listPullRequests,
  // Content
  getFileContent,
  searchCode,
  // Branches & Commits
  listBranches,
  getCommit,
  listCommits,
  // Releases
  listReleases,
  getRelease,
  // Gists
  createGist,
  listGists,
  // Actions
  listWorkflowRuns,
  getWorkflowRun,
};
