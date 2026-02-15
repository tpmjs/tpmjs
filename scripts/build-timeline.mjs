import { execSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// Get all commits
const raw = execSync('git log --pretty=format:"%H|%ad|%s" --date=short', {
  encoding: 'utf-8',
  maxBuffer: 1024 * 1024 * 10,
});

const commits = raw
  .trim()
  .split('\n')
  .map((line) => {
    const clean = line.replace(/^"|"$/g, '');
    const i1 = clean.indexOf('|');
    const i2 = clean.indexOf('|', i1 + 1);
    if (i1 === -1 || i2 === -1) return null;
    return {
      h: clean.slice(0, i1),
      d: clean.slice(i1 + 1, i2),
      m: clean.slice(i2 + 1),
    };
  })
  .filter(Boolean)
  .reverse();

// Parse conventional commits
function parse(msg) {
  const r = msg.match(
    /^(feat|fix|chore|docs|refactor|style|test|ci|perf|revert|debug|wip)(\(([^)]+)\))?[!]?:\s*(.+)/
  );
  if (r) return { t: r[1], s: r[3] || '', u: r[4] };
  return { t: 'other', s: '', u: msg };
}

const data = commits.map((c) => ({ ...c, ...parse(c.m) }));

const milestones = [
  { d: '2025-11-25', n: 'Project Genesis', x: 'Turborepo monorepo + Next.js 16 + TypeScript' },
  { d: '2025-11-26', n: 'Design System v1', x: 'Blueprint aesthetic, theme system, UI components' },
  {
    d: '2025-11-28',
    n: 'Registry Backend',
    x: 'Prisma DB, API routes, NPM sync workers, tool search',
  },
  {
    d: '2025-11-30',
    n: 'Tool Playground',
    x: 'AI SDK v6, Railway sandbox, interactive tool execution',
  },
  {
    d: '2025-12-04',
    n: 'Health & Dynamic Loading',
    x: 'Health checks, BM25 search, dynamic tool loading, Deno executor',
  },
  { d: '2025-12-05', n: 'CLI Generator', x: '@tpmjs/create-basic-tools, persistent Deno cache' },
  {
    d: '2026-01-09',
    n: 'Hot-Swap Executors',
    x: 'Vercel Sandbox SDK, custom executor docs, Claude CI',
  },
  { d: '2026-01-11', n: 'Agent System', x: 'Agent chat, tool error rendering, API reference docs' },
  { d: '2026-01-13', n: 'MCP Bridge & Auth', x: 'MCP Bridge, API key auth, username/slug URLs' },
  {
    d: '2026-01-14',
    n: 'Integration Tests',
    x: 'GitHub Actions CI, comprehensive integration tests',
  },
  { d: '2026-01-16', n: 'Design System v2', x: '14 new components, SWR, style guide compliance' },
  { d: '2026-01-17', n: 'Agent Chat Redesign', x: 'GPT-4.1 models, judge tool, password reset' },
  { d: '2026-01-18', n: 'Scenarios System', x: 'CLI package, collection testing, browser auth' },
  {
    d: '2026-01-20',
    n: 'CI Automation',
    x: 'Tool-request pipeline, E2B sandbox, label-triggered Claude',
  },
  {
    d: '2026-01-23',
    n: 'Omega AI Agent',
    x: 'Full AI agent chat, BM25 auto-loading, env var management',
  },
  {
    d: '2026-01-25',
    n: 'Skills Platform',
    x: 'RealSkills Q&A, Streamdown rendering, design refresh',
  },
  { d: '2026-01-27', n: 'Scenario Evaluation', x: 'JSON Schema validation, complete eval system' },
  { d: '2026-02-03', n: 'Executor Templates', x: 'Railway, Unsandbox, Vercel deployment guides' },
  { d: '2026-02-07', n: 'MCP Hardening', x: 'Schema sanitization, Resend tools, llms.txt' },
  {
    d: '2026-02-09',
    n: 'Omega Mac & Integrations',
    x: 'Native SwiftUI app, Slack, Discord, Supabase tools',
  },
  { d: '2026-02-10', n: 'Live Analytics', x: 'Real DB stats, view tracking, production CLAUDE.md' },
];

const outPath = fileURLToPath(new URL('../apps/web/public/timeline-data.json', import.meta.url));
mkdirSync(dirname(outPath), { recursive: true });

const json = `${JSON.stringify({ c: data, m: milestones }, null, '  ')}\n`;
writeFileSync(outPath, json);
console.log(`Built ${outPath} (${(json.length / 1024).toFixed(0)}KB) with ${data.length} commits`);
