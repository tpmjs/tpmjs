import { Button } from '@tpmjs/ui/Button/Button';
import { Container } from '@tpmjs/ui/Container/Container';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import type { Metadata } from 'next';
import Link from 'next/link';
import { AppHeader } from '~/components/AppHeader';

export const metadata: Metadata = {
  title: 'About',
  description:
    'TPMJS is an open-source registry and execution layer for AI tools. Learn about the project, the problem it solves, and the team behind it.',
};

export default function AboutPage(): React.ReactElement {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <Container size="md" padding="lg" className="py-16">
        <h1 className="text-3xl font-bold mb-8 text-foreground">About TPMJS</h1>

        <div className="max-w-none space-y-6">
          <p className="text-lg text-foreground-secondary">
            TPMJS is an open-source registry and execution layer for AI agent tools. It continuously
            scans npm for packages tagged as AI tools, extracts their schemas, validates them,
            scores their quality, and makes them instantly callable by any AI agent through MCP,
            SDK, or API.
          </p>

          <p className="text-foreground-secondary">
            The problem: AI agents are only as useful as the tools they can access, but discovering,
            validating, and connecting tools is scattered across GitHub repos, blog posts, and
            Discord threads. There is no central place to find what exists, no standard way to know
            if a tool actually works, and wiring up each tool to each client is tedious manual
            config. TPMJS fixes this by treating AI tools the way npm treats packages — one
            registry, automatic quality checks, and a universal interface.
          </p>

          <h2 className="text-xl font-semibold mt-10 mb-4 text-foreground">How it works</h2>

          <p className="text-foreground-secondary">
            Publish an npm package with the{' '}
            <code className="px-1.5 py-0.5 bg-surface border border-border text-sm font-mono">
              tpmjs
            </code>{' '}
            keyword and TPMJS picks it up within minutes. It extracts Zod/JSON schemas, runs health
            checks, computes quality scores, and serves the tool via MCP endpoints that work with
            Claude Code, Cursor, Windsurf, and any MCP-compatible client. You can group tools into
            collections, test them with auto-generated scenarios, and build agents that use them —
            all from one place.
          </p>

          <h2 className="text-xl font-semibold mt-10 mb-4 text-foreground">
            What makes it different
          </h2>

          <ul className="space-y-3 text-foreground-secondary">
            <li className="flex gap-3">
              <span className="text-primary font-bold mt-0.5">--</span>
              <span>
                <strong className="text-foreground">Auto-discovery from npm.</strong> No manual
                submission. Publish to npm with the right keyword and your tool is live within
                minutes.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-primary font-bold mt-0.5">--</span>
              <span>
                <strong className="text-foreground">Quality scoring.</strong> Every tool is scored
                on schema validity, documentation, health check pass rates, download trends, and
                maintenance activity.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-primary font-bold mt-0.5">--</span>
              <span>
                <strong className="text-foreground">Universal MCP endpoints.</strong> One URL per
                collection, compatible with Claude Code, Cursor, Windsurf, and any MCP client.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-primary font-bold mt-0.5">--</span>
              <span>
                <strong className="text-foreground">Open source.</strong> The entire platform —
                registry, executor, CLI, SDK, and web app — is MIT licensed. Inspect, contribute, or
                self-host.
              </span>
            </li>
          </ul>

          <h2 className="text-xl font-semibold mt-10 mb-4 text-foreground">Tech stack</h2>

          <p className="text-foreground-secondary">
            Turborepo monorepo with Next.js (App Router), PostgreSQL via Prisma, deployed on Vercel.
            Tool execution runs in isolated Deno sandboxes on Railway. The CLI and SDK are published
            to npm under the{' '}
            <code className="px-1.5 py-0.5 bg-surface border border-border text-sm font-mono">
              @tpmjs
            </code>{' '}
            scope. MCP implementation follows the Model Context Protocol specification with HTTP
            transport.
          </p>

          <h2 className="text-xl font-semibold mt-10 mb-4 text-foreground">Built by</h2>

          <p className="text-foreground-secondary">
            TPMJS was created by <strong className="text-foreground">Ajax Davis</strong> (Thomas
            Davis) in 2024. It started as a side project to scratch an itch — finding usable AI
            tools was harder than it should be — and grew into a full platform. It is free to use
            and open source.
          </p>

          <div className="flex items-center gap-6 mt-4">
            <a
              href="https://x.com/ajaxdavis"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-foreground-secondary hover:text-primary transition-colors"
            >
              <Icon icon="x" size="md" />
              <span>@ajaxdavis</span>
            </a>

            <a
              href="https://ajaxdavis.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-foreground-secondary hover:text-primary transition-colors"
            >
              <Icon icon="globe" size="md" />
              <span>ajaxdavis.dev</span>
            </a>

            <a
              href="https://github.com/tpmjs/tpmjs"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-foreground-secondary hover:text-primary transition-colors"
            >
              <Icon icon="github" size="md" />
              <span>GitHub</span>
            </a>
          </div>

          <div className="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row gap-4">
            <Link href="/getting-started">
              <Button variant="default" size="lg">
                Get Started
              </Button>
            </Link>
            <a href="https://github.com/tpmjs/tpmjs" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="lg">
                <Icon icon="github" size="sm" className="mr-2" />
                View Source
              </Button>
            </a>
          </div>
        </div>
      </Container>
    </div>
  );
}
