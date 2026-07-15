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
            The problem in 2026 is no longer &ldquo;where do I find MCP tools.&rdquo; The Model
            Context Protocol is now the de facto standard, stewarded under the Linux Foundation, and
            an official registry indexes thousands of servers. But that index points at packages — it
            deliberately does not run them, score them, or vouch for them. Meanwhile installing an
            untrusted MCP server means running untrusted code on your machine (2026 saw real
            supply-chain worms and credential-stealing servers), and loading dozens of servers buries
            an agent&apos;s context window in tool schemas. TPMJS is the layer that fills that gap:
            it treats AI tools the way npm treats packages, then adds the three things a bare index
            can&apos;t — it <strong className="text-foreground">curates</strong>, <strong className="text-foreground">scores</strong>, and <strong className="text-foreground">runs</strong> each
            tool in an isolated sandbox so your agent never touches untrusted code.
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
                <strong className="text-foreground">Sandboxed execution.</strong> Tools run in an
                isolated hosted Deno sandbox with timeouts and rate limits — the agent never installs
                the package or runs its code locally. A directory can only tell you a tool exists;
                TPMJS runs it for you at arm&apos;s length.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-primary font-bold mt-0.5">--</span>
              <span>
                <strong className="text-foreground">Quality &amp; health scoring.</strong> Every
                tool is scored on schema validity, documentation, health-check pass rates, download
                trends, and maintenance activity — the runtime verification the official registry
                deliberately leaves to downstream layers. Dead tools don&apos;t look like live ones.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-primary font-bold mt-0.5">--</span>
              <span>
                <strong className="text-foreground">Curated collections, one MCP URL.</strong>{' '}
                Group the tools an agent actually needs and expose them through a single URL to Claude
                Code, Cursor, ChatGPT, or any MCP client — on-demand discovery instead of tens of
                thousands of tokens of schemas.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-primary font-bold mt-0.5">--</span>
              <span>
                <strong className="text-foreground">Auto-discovery from npm.</strong> No manual
                submission, no server to stand up. Publish to npm with the{' '}
                <code className="px-1 py-0.5 bg-surface border border-border text-sm font-mono">
                  tpmjs
                </code>{' '}
                keyword and your tool is live within minutes.
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
            Turborepo monorepo with Next.js (App Router) and PostgreSQL via Prisma, self-hosted in
            containers. Tool execution runs in isolated Deno sandboxes. The CLI and SDK are published
            to npm under the{' '}
            <code className="px-1.5 py-0.5 bg-surface border border-border text-sm font-mono">
              @tpmjs
            </code>{' '}
            scope. The MCP implementation follows the Model Context Protocol specification (Streamable
            HTTP transport), so a collection works with any compliant client.
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
