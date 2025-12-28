#!/usr/bin/env npx tsx
/**
 * Generate OG images for all pages
 * Run with: npx tsx scripts/generate-og-images.ts
 */

import { mkdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import OpenAI from 'openai';
import { buildOGPrompt } from '../src/lib/og/prompt-builder';
import type { PageContent } from '../src/lib/og/types';

const OUTPUT_DIR = path.join(process.cwd(), 'public', 'og');
const MAX_AGE_DAYS = 30;

// Static pages to generate
const STATIC_PAGES: Array<{ slug: string; content: PageContent }> = [
  {
    slug: 'home',
    content: {
      pageType: 'home',
      title: 'TPMJS',
      description: 'Tool Package Manager for AI Agents',
      keywords: ['AI', 'tools', 'npm', 'registry'],
    },
  },
  {
    slug: 'docs',
    content: {
      pageType: 'docs',
      title: 'Documentation',
      description: 'Complete guide to using TPMJS',
      keywords: ['documentation', 'guide', 'tutorial'],
    },
  },
  {
    slug: 'stats',
    content: {
      pageType: 'stats',
      title: 'Registry Statistics',
      description: 'Real-time metrics for TPMJS registry',
      keywords: ['statistics', 'metrics', 'analytics'],
    },
  },
  {
    slug: 'publish',
    content: {
      pageType: 'publish',
      title: 'Publish Your Tool',
      description: 'Share your AI tool with the community',
      keywords: ['publish', 'create', 'npm'],
    },
  },
  {
    slug: 'playground',
    content: {
      pageType: 'playground',
      title: 'Playground',
      description: 'Test and experiment with AI tools',
      keywords: ['playground', 'test', 'experiment'],
    },
  },
  {
    slug: 'tool-search',
    content: {
      pageType: 'search',
      title: 'Tool Search',
      description: 'Search and discover AI tools',
      keywords: ['search', 'browse', 'discover'],
    },
  },
  {
    slug: 'faq',
    content: {
      pageType: 'faq',
      title: 'FAQ',
      description: 'Frequently asked questions about TPMJS',
      keywords: ['faq', 'questions', 'help'],
    },
  },
  {
    slug: 'sdk',
    content: {
      pageType: 'sdk',
      title: 'SDK',
      description: 'TPMJS SDK for integrating tools',
      keywords: ['sdk', 'integration', 'api'],
    },
  },
  {
    slug: 'spec',
    content: {
      pageType: 'spec',
      title: 'Specification',
      description: 'TPMJS tool specification and schema',
      keywords: ['spec', 'specification', 'schema'],
    },
  },
  {
    slug: 'changelog',
    content: {
      pageType: 'changelog',
      title: 'Changelog',
      description: 'TPMJS release history and updates',
      keywords: ['changelog', 'releases', 'updates'],
    },
  },
  {
    slug: 'how-it-works',
    content: {
      pageType: 'how-it-works',
      title: 'How It Works',
      description: 'Learn how TPMJS works under the hood',
      keywords: ['how', 'works', 'architecture'],
    },
  },
  {
    slug: 'privacy',
    content: {
      pageType: 'privacy',
      title: 'Privacy Policy',
      description: 'TPMJS privacy policy',
      keywords: ['privacy', 'policy', 'data'],
    },
  },
  {
    slug: 'terms',
    content: {
      pageType: 'terms',
      title: 'Terms of Service',
      description: 'TPMJS terms and conditions',
      keywords: ['terms', 'service', 'legal'],
    },
  },
];

let openai: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openai) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openai;
}

async function generateImage(prompt: string): Promise<Buffer> {
  const client = getOpenAIClient();

  const response = await client.images.generate({
    model: 'gpt-image-1-mini',
    prompt,
    n: 1,
    size: '1536x1024',
    quality: 'medium',
  });

  if (!response.data || response.data.length === 0) {
    throw new Error('No data returned from OpenAI');
  }

  const b64 = response.data[0]?.b64_json;
  if (!b64) {
    throw new Error('No base64 image data returned');
  }

  return Buffer.from(b64, 'base64');
}

async function shouldRegenerate(filePath: string): Promise<boolean> {
  try {
    const stats = await stat(filePath);
    const ageMs = Date.now() - stats.mtime.getTime();
    const ageDays = ageMs / (1000 * 60 * 60 * 24);
    return ageDays > MAX_AGE_DAYS;
  } catch {
    // File doesn't exist
    return true;
  }
}

async function generateStaticPages(): Promise<void> {
  console.log('\n📄 Generating static page images...\n');

  for (const page of STATIC_PAGES) {
    const filePath = path.join(OUTPUT_DIR, `${page.slug}.png`);

    if (!(await shouldRegenerate(filePath))) {
      console.log(`  ⏭️  ${page.slug} - skipped (fresh)`);
      continue;
    }

    console.log(`  🎨 ${page.slug} - generating...`);

    try {
      const prompt = buildOGPrompt(page.content);
      const buffer = await generateImage(prompt);
      await writeFile(filePath, buffer);
      console.log(`  ✅ ${page.slug} - saved`);
    } catch (error) {
      console.error(`  ❌ ${page.slug} - failed:`, error);
    }
  }
}

async function fetchTools(): Promise<
  Array<{
    id: string;
    name: string;
    packageName: string;
    description: string;
    category: string;
  }>
> {
  // Fetch tools from production API
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tpmjs.com';

  try {
    const response = await fetch(`${baseUrl}/api/tools?limit=100`);
    if (!response.ok) {
      console.warn('Failed to fetch tools from API, skipping tool images');
      return [];
    }

    const json = await response.json();
    // API returns { data: [...tools] } where each tool has package.npmPackageName
    const tools = json.data || [];
    return tools.map(
      (tool: {
        name: string;
        description: string;
        package: { npmPackageName: string; category: string };
      }) => ({
        id: tool.name,
        name: tool.name,
        packageName: tool.package.npmPackageName,
        description: tool.description || '',
        category: tool.package.category || 'other',
      })
    );
  } catch (error) {
    console.warn('Could not fetch tools:', error);
    return [];
  }
}

function slugifyToolPath(packageName: string, toolName: string): string {
  // Convert @scope/package/toolName to scope-package-toolName
  return `${packageName}/${toolName}`
    .replace(/^@/, '')
    .replace(/\//g, '-')
    .replace(/[^a-zA-Z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .toLowerCase();
}

async function generateToolPages(): Promise<void> {
  console.log('\n🔧 Generating tool page images...\n');

  const tools = await fetchTools();

  if (tools.length === 0) {
    console.log('  ⚠️  No tools found, skipping tool images');
    return;
  }

  console.log(`  Found ${tools.length} tools\n`);

  // Create tools subdirectory
  const toolsDir = path.join(OUTPUT_DIR, 'tool');
  await mkdir(toolsDir, { recursive: true });

  for (const tool of tools) {
    const slug = slugifyToolPath(tool.packageName, tool.name);
    const filePath = path.join(toolsDir, `${slug}.png`);

    if (!(await shouldRegenerate(filePath))) {
      console.log(`  ⏭️  ${tool.name} - skipped (fresh)`);
      continue;
    }

    console.log(`  🎨 ${tool.name} - generating...`);

    try {
      const content: PageContent = {
        pageType: 'tool',
        title: tool.name,
        description: tool.description || `AI tool from ${tool.packageName}`,
        keywords: [tool.category, 'AI', 'tool'],
        tool: {
          name: tool.name,
          packageName: tool.packageName,
          category: tool.category || 'other',
          description: tool.description || '',
        },
      };

      const prompt = buildOGPrompt(content);
      const buffer = await generateImage(prompt);
      await writeFile(filePath, buffer);
      console.log(`  ✅ ${tool.name} - saved`);
    } catch (error) {
      console.error(`  ❌ ${tool.name} - failed:`, error);
    }

    // Rate limit - wait 500ms between requests
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
}

async function main(): Promise<void> {
  console.log('🖼️  TPMJS OG Image Generator\n');
  console.log(`Output directory: ${OUTPUT_DIR}`);
  console.log(`Max age: ${MAX_AGE_DAYS} days`);

  // Ensure output directory exists
  await mkdir(OUTPUT_DIR, { recursive: true });

  // Generate static pages
  await generateStaticPages();

  // Generate tool pages
  await generateToolPages();

  console.log('\n✨ Done!\n');
}

main().catch(console.error);
