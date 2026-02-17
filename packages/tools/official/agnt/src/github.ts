/**
 * @tpmjs/official-agnt-github — GitHub API Tools for AI Agents
 *
 * Interact with GitHub repositories, issues, pull requests, file content,
 * and commits via the GitHub REST API.
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
      'GITHUB_TOKEN environment variable is required. Create a personal access token at https://github.com/settings/tokens'
    );
  }
  return key;
}

async function githubRequest<T>(method: string, path: string, body?: unknown): Promise<T> {
  const key = getApiKey();

  const headers: Record<string, string> = {
    Authorization: `Bearer ${key}`,
    Accept: 'application/vnd.github+json',
    'Content-Type': 'application/json',
    'X-GitHub-Api-Version': '2022-11-28',
  };

  const options: RequestInit = { method, headers };
  if (body !== undefined) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${BASE_URL}${path}`, options);

  if (!response.ok) {
    await handleApiError(response);
  }

  if (response.status === 204) {
    return { success: true } as T;
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
    const errorData = (await response.json()) as {
      message?: string;
      documentation_url?: string;
    };
    errorMessage = errorData.message || `HTTP ${response.status}`;
  } catch {
    errorMessage = `HTTP ${response.status}: ${response.statusText}`;
  }

  switch (response.status) {
    case 401:
      throw new Error('Authentication failed: Invalid GitHub token. Check GITHUB_TOKEN.');
    case 403:
      throw new Error(
        `Access forbidden or rate limit exceeded: ${errorMessage}. Check token permissions.`
      );
    case 404:
      throw new Error(`Not found: ${errorMessage}. Verify the repository, owner, and path exist.`);
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

// ─── Output Types ────────────────────────────────────────────────────────────

export interface CreateIssueResult {
  number: number;
  title: string;
  url: string;
  state: string;
}

export interface CreatePullRequestResult {
  number: number;
  title: string;
  url: string;
  state: string;
  mergeable: boolean | null;
}

export interface RepoInfoResult {
  name: string;
  fullName: string;
  description: string | null;
  stars: number;
  forks: number;
  openIssues: number;
  language: string | null;
  defaultBranch: string;
  url: string;
}

export interface PullRequestSummary {
  number: number;
  title: string;
  state: string;
  user: string;
  createdAt: string;
  url: string;
}

export interface FileContentResult {
  name: string;
  path: string;
  content: string;
  size: number;
  sha: string;
  url: string;
}

export interface CommitSummary {
  sha: string;
  message: string;
  author: string;
  date: string;
  url: string;
}

// ─── Raw API types ───────────────────────────────────────────────────────────

interface GitHubIssueResponse {
  number: number;
  title: string;
  html_url: string;
  state: string;
}

interface GitHubPullResponse {
  number: number;
  title: string;
  html_url: string;
  state: string;
  mergeable: boolean | null;
}

interface GitHubRepoResponse {
  name: string;
  full_name: string;
  description: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  language: string | null;
  default_branch: string;
  html_url: string;
}

interface GitHubPullListItem {
  number: number;
  title: string;
  state: string;
  user: { login: string } | null;
  created_at: string;
  html_url: string;
}

interface GitHubContentResponse {
  name: string;
  path: string;
  content: string;
  size: number;
  sha: string;
  html_url: string;
  encoding: string;
}

interface GitHubCommitListItem {
  sha: string;
  commit: {
    message: string;
    author: { name: string; date: string } | null;
  };
  html_url: string;
}

// ─── createIssue ─────────────────────────────────────────────────────────────

export interface CreateIssueInput {
  owner: string;
  repo: string;
  title: string;
  body?: string;
  labels?: string;
}

export const createIssue = tool({
  description:
    'Create a new issue in a GitHub repository. Optionally include a body description and comma-separated labels.',
  inputSchema: jsonSchema<CreateIssueInput>({
    type: 'object',
    properties: {
      owner: { type: 'string', description: 'The owner (user or organization) of the repository.' },
      repo: { type: 'string', description: 'The repository name.' },
      title: { type: 'string', description: 'The title of the issue.' },
      body: { type: 'string', description: 'The body content of the issue in markdown.' },
      labels: {
        type: 'string',
        description: 'Comma-separated list of label names to apply (e.g., "bug,high-priority").',
      },
    },
    required: ['owner', 'repo', 'title'],
    additionalProperties: false,
  }),
  async execute(input: CreateIssueInput): Promise<CreateIssueResult> {
    try {
      if (!input.owner || !input.repo || !input.title) {
        throw new Error('owner, repo, and title are required and must be non-empty');
      }

      const requestBody: { title: string; body?: string; labels?: string[] } = {
        title: input.title,
      };
      if (input.body) {
        requestBody.body = input.body;
      }
      if (input.labels) {
        requestBody.labels = input.labels
          .split(',')
          .map((l) => l.trim())
          .filter(Boolean);
      }

      const data = await githubRequest<GitHubIssueResponse>(
        'POST',
        `/repos/${input.owner}/${input.repo}/issues`,
        requestBody
      );

      return {
        number: data.number,
        title: data.title,
        url: data.html_url,
        state: data.state,
      };
    } catch (error) {
      throw new Error(`Failed to create issue: ${(error as Error).message}`);
    }
  },
});

// ─── createPullRequest ───────────────────────────────────────────────────────

export interface CreatePullRequestInput {
  owner: string;
  repo: string;
  title: string;
  body?: string;
  head: string;
  base?: string;
}

export const createPullRequest = tool({
  description:
    'Create a new pull request in a GitHub repository. Specify the source branch (head) and target branch (base, defaults to "main").',
  inputSchema: jsonSchema<CreatePullRequestInput>({
    type: 'object',
    properties: {
      owner: { type: 'string', description: 'The owner (user or organization) of the repository.' },
      repo: { type: 'string', description: 'The repository name.' },
      title: { type: 'string', description: 'The title of the pull request.' },
      body: {
        type: 'string',
        description: 'The body description of the pull request in markdown.',
      },
      head: {
        type: 'string',
        description: 'The source branch name containing the changes.',
      },
      base: {
        type: 'string',
        description: 'The target branch to merge into (default: "main").',
      },
    },
    required: ['owner', 'repo', 'title', 'head'],
    additionalProperties: false,
  }),
  async execute(input: CreatePullRequestInput): Promise<CreatePullRequestResult> {
    try {
      if (!input.owner || !input.repo || !input.title || !input.head) {
        throw new Error('owner, repo, title, and head are required and must be non-empty');
      }

      const data = await githubRequest<GitHubPullResponse>(
        'POST',
        `/repos/${input.owner}/${input.repo}/pulls`,
        {
          title: input.title,
          body: input.body,
          head: input.head,
          base: input.base ?? 'main',
        }
      );

      return {
        number: data.number,
        title: data.title,
        url: data.html_url,
        state: data.state,
        mergeable: data.mergeable,
      };
    } catch (error) {
      throw new Error(`Failed to create pull request: ${(error as Error).message}`);
    }
  },
});

// ─── getRepoInfo ─────────────────────────────────────────────────────────────

export interface GetRepoInfoInput {
  owner: string;
  repo: string;
}

export const getRepoInfo = tool({
  description:
    'Get information about a GitHub repository including stars, forks, language, and default branch.',
  inputSchema: jsonSchema<GetRepoInfoInput>({
    type: 'object',
    properties: {
      owner: { type: 'string', description: 'The owner (user or organization) of the repository.' },
      repo: { type: 'string', description: 'The repository name.' },
    },
    required: ['owner', 'repo'],
    additionalProperties: false,
  }),
  async execute(input: GetRepoInfoInput): Promise<RepoInfoResult> {
    try {
      if (!input.owner || !input.repo) {
        throw new Error('owner and repo are required and must be non-empty');
      }

      const data = await githubRequest<GitHubRepoResponse>(
        'GET',
        `/repos/${input.owner}/${input.repo}`
      );

      return {
        name: data.name,
        fullName: data.full_name,
        description: data.description,
        stars: data.stargazers_count,
        forks: data.forks_count,
        openIssues: data.open_issues_count,
        language: data.language,
        defaultBranch: data.default_branch,
        url: data.html_url,
      };
    } catch (error) {
      throw new Error(`Failed to get repository info: ${(error as Error).message}`);
    }
  },
});

// ─── listPullRequests ────────────────────────────────────────────────────────

export interface ListPullRequestsInput {
  owner: string;
  repo: string;
  state?: string;
  perPage?: number;
}

export const listPullRequests = tool({
  description:
    'List pull requests in a GitHub repository. Filter by state (open, closed, or all) and limit the number of results.',
  inputSchema: jsonSchema<ListPullRequestsInput>({
    type: 'object',
    properties: {
      owner: { type: 'string', description: 'The owner (user or organization) of the repository.' },
      repo: { type: 'string', description: 'The repository name.' },
      state: {
        type: 'string',
        description: 'Filter by state: "open", "closed", or "all" (default: "open").',
      },
      perPage: {
        type: 'number',
        description: 'Number of results per page (1-100, default: 10).',
      },
    },
    required: ['owner', 'repo'],
    additionalProperties: false,
  }),
  async execute(input: ListPullRequestsInput): Promise<PullRequestSummary[]> {
    try {
      if (!input.owner || !input.repo) {
        throw new Error('owner and repo are required and must be non-empty');
      }
      if (input.state !== undefined && !['open', 'closed', 'all'].includes(input.state)) {
        throw new Error('state must be "open", "closed", or "all"');
      }
      if (input.perPage !== undefined && (input.perPage < 1 || input.perPage > 100)) {
        throw new Error('perPage must be between 1 and 100');
      }

      const qs = buildQueryString({
        state: input.state ?? 'open',
        per_page: input.perPage ?? 10,
      });

      const data = await githubRequest<GitHubPullListItem[]>(
        'GET',
        `/repos/${input.owner}/${input.repo}/pulls${qs}`
      );

      return data.map((pr) => ({
        number: pr.number,
        title: pr.title,
        state: pr.state,
        user: pr.user?.login ?? 'unknown',
        createdAt: pr.created_at,
        url: pr.html_url,
      }));
    } catch (error) {
      throw new Error(`Failed to list pull requests: ${(error as Error).message}`);
    }
  },
});

// ─── getFileContent ──────────────────────────────────────────────────────────

export interface GetFileContentInput {
  owner: string;
  repo: string;
  path: string;
  ref?: string;
}

export const getFileContent = tool({
  description:
    'Get the content of a file from a GitHub repository. Optionally specify a branch or tag ref.',
  inputSchema: jsonSchema<GetFileContentInput>({
    type: 'object',
    properties: {
      owner: { type: 'string', description: 'The owner (user or organization) of the repository.' },
      repo: { type: 'string', description: 'The repository name.' },
      path: {
        type: 'string',
        description: 'The file path within the repository (e.g., "src/index.ts").',
      },
      ref: {
        type: 'string',
        description:
          'The branch name, tag, or commit SHA to read the file from (default: repository default branch).',
      },
    },
    required: ['owner', 'repo', 'path'],
    additionalProperties: false,
  }),
  async execute(input: GetFileContentInput): Promise<FileContentResult> {
    try {
      if (!input.owner || !input.repo || !input.path) {
        throw new Error('owner, repo, and path are required and must be non-empty');
      }

      const qs = buildQueryString({ ref: input.ref });

      const data = await githubRequest<GitHubContentResponse>(
        'GET',
        `/repos/${input.owner}/${input.repo}/contents/${input.path}${qs}`
      );

      // Decode base64 content
      let decodedContent: string;
      if (data.encoding === 'base64' && data.content) {
        // Remove newlines that GitHub inserts in base64 content
        const cleanBase64 = data.content.replace(/\n/g, '');
        decodedContent = atob(cleanBase64);
      } else {
        decodedContent = data.content ?? '';
      }

      return {
        name: data.name,
        path: data.path,
        content: decodedContent,
        size: data.size,
        sha: data.sha,
        url: data.html_url,
      };
    } catch (error) {
      throw new Error(`Failed to get file content: ${(error as Error).message}`);
    }
  },
});

// ─── listCommits ─────────────────────────────────────────────────────────────

export interface ListCommitsInput {
  owner: string;
  repo: string;
  perPage?: number;
  sha?: string;
}

export const listCommits = tool({
  description:
    'List recent commits in a GitHub repository. Optionally filter by branch or limit the number of results.',
  inputSchema: jsonSchema<ListCommitsInput>({
    type: 'object',
    properties: {
      owner: { type: 'string', description: 'The owner (user or organization) of the repository.' },
      repo: { type: 'string', description: 'The repository name.' },
      perPage: {
        type: 'number',
        description: 'Number of commits to return (1-100, default: 10).',
      },
      sha: {
        type: 'string',
        description:
          'Branch name or commit SHA to list commits from (default: repository default branch).',
      },
    },
    required: ['owner', 'repo'],
    additionalProperties: false,
  }),
  async execute(input: ListCommitsInput): Promise<CommitSummary[]> {
    try {
      if (!input.owner || !input.repo) {
        throw new Error('owner and repo are required and must be non-empty');
      }
      if (input.perPage !== undefined && (input.perPage < 1 || input.perPage > 100)) {
        throw new Error('perPage must be between 1 and 100');
      }

      const qs = buildQueryString({
        per_page: input.perPage ?? 10,
        sha: input.sha,
      });

      const data = await githubRequest<GitHubCommitListItem[]>(
        'GET',
        `/repos/${input.owner}/${input.repo}/commits${qs}`
      );

      return data.map((commit) => ({
        sha: commit.sha,
        message: commit.commit.message,
        author: commit.commit.author?.name ?? 'unknown',
        date: commit.commit.author?.date ?? '',
        url: commit.html_url,
      }));
    } catch (error) {
      throw new Error(`Failed to list commits: ${(error as Error).message}`);
    }
  },
});
