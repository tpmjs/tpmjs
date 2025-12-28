/**
 * Extract page content for OG image generation
 */

import type { PageContent } from './types';

/**
 * Static content map for known pages
 */
const STATIC_PAGES: Record<string, PageContent> = {
  home: {
    pageType: 'home',
    title: 'TPMJS',
    description: 'Tool Package Manager for AI Agents',
    keywords: ['AI', 'tools', 'npm', 'registry', 'LLM', 'agents'],
  },
  docs: {
    pageType: 'docs',
    title: 'Documentation',
    description: 'Complete guide to using TPMJS',
    keywords: ['documentation', 'guide', 'tutorial', 'getting started'],
  },
  publish: {
    pageType: 'publish',
    title: 'Publish Your Tool',
    description: 'Share your AI tool with the community',
    keywords: ['publish', 'create', 'npm', 'contribute'],
  },
  stats: {
    pageType: 'stats',
    title: 'Registry Statistics',
    description: 'Real-time metrics for TPMJS registry',
    keywords: ['statistics', 'metrics', 'analytics', 'dashboard'],
  },
  'tool-search': {
    pageType: 'search',
    title: 'Tool Search',
    description: 'Search and discover AI tools',
    keywords: ['search', 'browse', 'discover', 'find'],
  },
  faq: {
    pageType: 'faq',
    title: 'Frequently Asked Questions',
    description: 'Common questions about TPMJS',
    keywords: ['faq', 'questions', 'help', 'support'],
  },
  playground: {
    pageType: 'playground',
    title: 'Playground',
    description: 'Test and experiment with AI tools',
    keywords: ['playground', 'test', 'experiment', 'demo'],
  },
  spec: {
    pageType: 'spec',
    title: 'Specification',
    description: 'TPMJS tool specification and schema',
    keywords: ['spec', 'specification', 'schema', 'format'],
  },
  sdk: {
    pageType: 'sdk',
    title: 'SDK',
    description: 'TPMJS SDK for integrating tools',
    keywords: ['sdk', 'integration', 'api', 'library'],
  },
  changelog: {
    pageType: 'changelog',
    title: 'Changelog',
    description: 'TPMJS release history and updates',
    keywords: ['changelog', 'releases', 'updates', 'versions'],
  },
  'how-it-works': {
    pageType: 'how-it-works',
    title: 'How It Works',
    description: 'Learn how TPMJS works under the hood',
    keywords: ['how', 'works', 'architecture', 'process'],
  },
  terms: {
    pageType: 'terms',
    title: 'Terms of Service',
    description: 'TPMJS terms and conditions',
    keywords: ['terms', 'service', 'legal', 'agreement'],
  },
  privacy: {
    pageType: 'privacy',
    title: 'Privacy Policy',
    description: 'TPMJS privacy policy',
    keywords: ['privacy', 'policy', 'data', 'protection'],
  },
};

/**
 * Normalize path for cache key and lookup
 */
export function normalizePath(path: string): string {
  return path
    .toLowerCase()
    .replace(/^\/+|\/+$/g, '') // Trim slashes
    .replace(/\//g, '-') // Replace slashes with dashes
    .replace(/[^a-z0-9-]/g, '-') // Replace special chars
    .replace(/-+/g, '-') // Collapse multiple dashes
    .replace(/^-|-$/g, ''); // Trim leading/trailing dashes
}

/**
 * Parse tool path to extract package name and export name
 */
function parseToolPath(path: string): { packageName: string; exportName?: string } {
  // Remove /tool/ prefix
  const segments = path.replace(/^\/tool\//, '').split('/');

  let packageName: string;
  let exportName: string | undefined;

  if (segments[0]?.startsWith('@')) {
    // Scoped package: @scope/package/export
    packageName = segments.slice(0, 2).join('/');
    exportName = segments[2];
  } else {
    // Unscoped: package/export
    packageName = segments[0] || '';
    exportName = segments[1];
  }

  return { packageName, exportName };
}

/**
 * Fetch tool data from internal API
 */
async function fetchToolContent(path: string): Promise<PageContent> {
  const { packageName, exportName } = parseToolPath(path);

  // Build API URL
  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const apiPath = exportName
    ? `/api/tools/${encodeURIComponent(packageName)}/${encodeURIComponent(exportName)}`
    : `/api/tools/${encodeURIComponent(packageName)}`;

  try {
    const response = await fetch(`${baseUrl}${apiPath}`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    const { data } = await response.json();
    const tool = data.tools ? data.tools[0] : data;

    if (!tool) {
      throw new Error('Tool not found');
    }

    return {
      pageType: 'tool',
      title: tool.name || exportName || packageName,
      description: tool.description || `AI tool from ${packageName}`,
      keywords: [tool.package?.category || 'tool', 'AI', 'npm', packageName],
      tool: {
        name: tool.name || exportName || 'Tool',
        packageName: tool.package?.npmPackageName || packageName,
        category: tool.package?.category || 'other',
        description: tool.description || '',
        downloads: tool.package?.npmDownloadsLastMonth,
        qualityScore: tool.qualityScore ? Number(tool.qualityScore) : undefined,
      },
    };
  } catch (error) {
    console.error('Failed to fetch tool content:', error);

    // Return basic content on failure
    return {
      pageType: 'tool',
      title: exportName || packageName,
      description: `AI tool from ${packageName}`,
      keywords: ['tool', 'AI', 'npm'],
      tool: {
        name: exportName || 'Tool',
        packageName,
        category: 'other',
        description: '',
      },
    };
  }
}

/**
 * Extract page content based on path
 */
export async function extractPageContent(path: string): Promise<PageContent> {
  // Normalize the path
  const normalizedPath = path.replace(/^\/+|\/+$/g, '');

  // Check static pages first
  if (normalizedPath === '' || normalizedPath === 'home') {
    const homePage = STATIC_PAGES.home;
    if (homePage) return homePage;
  }

  // Direct match in static pages
  const staticPage = STATIC_PAGES[normalizedPath];
  if (staticPage) {
    return staticPage;
  }

  // Handle tool/tool-search specifically
  if (normalizedPath === 'tool/tool-search') {
    const searchPage = STATIC_PAGES['tool-search'];
    if (searchPage) return searchPage;
  }

  // Handle tool detail pages
  if (normalizedPath.startsWith('tool/')) {
    return fetchToolContent(`/${normalizedPath}`);
  }

  // Default fallback
  return {
    pageType: 'static',
    title: 'TPMJS',
    description: 'Tool Package Manager for AI Agents',
    keywords: ['AI', 'tools'],
  };
}
