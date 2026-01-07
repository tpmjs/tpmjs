/**
 * GitHub Repository Statistics Client
 * Fetches star counts from GitHub API
 */

import { z } from 'zod';

const GITHUB_API_URL = 'https://api.github.com';

/**
 * Schema for GitHub repository response
 */
const GitHubRepoSchema = z.object({
  stargazers_count: z.number(),
  full_name: z.string(),
});

export type GitHubRepoResponse = z.infer<typeof GitHubRepoSchema>;

/**
 * Parses a GitHub URL or repository string to extract owner and repo
 * Supports formats:
 * - https://github.com/owner/repo
 * - https://github.com/owner/repo.git
 * - git://github.com/owner/repo.git
 * - git+https://github.com/owner/repo.git
 * - github:owner/repo
 * - { url: "..." } object format
 */
export function parseGitHubUrl(
  repository: string | { type?: string; url?: string } | null | undefined
): { owner: string; repo: string } | null {
  if (!repository) {
    return null;
  }

  let url: string;

  if (typeof repository === 'object') {
    if (!repository.url) {
      return null;
    }
    url = repository.url;
  } else {
    url = repository;
  }

  // Handle github: shorthand
  if (url.startsWith('github:')) {
    const parts = url.replace('github:', '').split('/');
    const owner = parts[0];
    const repo = parts[1];
    if (owner && repo) {
      return { owner, repo: repo.replace('.git', '') };
    }
    return null;
  }

  // Handle various GitHub URL formats
  const githubRegex = /github\.com[/:]([\w.-]+)\/([\w.-]+?)(?:\.git)?(?:\/|$)/i;
  const match = url.match(githubRegex);

  if (match?.[1] && match[2]) {
    return { owner: match[1], repo: match[2] };
  }

  return null;
}

/**
 * Fetches star count for a GitHub repository
 * @param owner - Repository owner (user or organization)
 * @param repo - Repository name
 * @returns Star count, or 0 if not found or on error
 */
export async function fetchGitHubStars(owner: string, repo: string): Promise<number> {
  const url = `${GITHUB_API_URL}/repos/${owner}/${repo}`;

  try {
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'tpmjs-registry',
    };

    // Add GitHub token if available for higher rate limits
    const token = process.env.GITHUB_TOKEN;
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(url, { headers });

    if (response.status === 404) {
      // Repository not found
      return 0;
    }

    if (response.status === 403) {
      // Rate limited
      console.warn('GitHub API rate limited');
      return 0;
    }

    if (!response.ok) {
      console.error(`GitHub API error: ${response.status} ${response.statusText}`);
      return 0;
    }

    const data = await response.json();
    const parsed = GitHubRepoSchema.safeParse(data);

    if (!parsed.success) {
      console.error('Failed to parse GitHub response:', parsed.error);
      return 0;
    }

    return parsed.data.stargazers_count;
  } catch (error) {
    console.error(`Failed to fetch GitHub stars for ${owner}/${repo}:`, error);
    return 0;
  }
}

/**
 * Fetches star count from a repository URL or object
 * @param repository - Repository URL string or object with url property
 * @returns Star count, or 0 if not a GitHub repo or on error
 */
export async function fetchGitHubStarsFromRepository(
  repository: string | { type?: string; url?: string } | null | undefined
): Promise<number> {
  const parsed = parseGitHubUrl(repository);

  if (!parsed) {
    return 0;
  }

  return fetchGitHubStars(parsed.owner, parsed.repo);
}
