import { Button } from '@tpmjs/ui/Button/Button';
import { Container } from '@tpmjs/ui/Container/Container';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import type { Metadata } from 'next';
import Link from 'next/link';
import { AppHeader } from '~/components/AppHeader';

export const metadata: Metadata = {
  title: 'About',
  description:
    'TPMJS is the open-source tool layer for AI agents — one curated collection served as a CLI, an MCP server, a REST API, a typed SDK, and a loadable skill. Learn about the project, the problem it solves, and the team behind it.',
};

export default function AboutPage(): React.ReactElement {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <Container size="md" padding="lg" className="py-16">
        <h1 className="text-3xl font-bold mb-8 text-foreground">About TPMJS</h1>

        <div className="max-w-none space-y-6">
          <p className="text-lg text-foreground-secondary">
            TPMJS is the open-source <strong className="text-foreground">tool layer for AI agents</strong>.
            It continuously scans npm for packages tagged as AI tools, extracts their schemas,
            validates them, and scores their quality — then serves your curated collection through
            every surface an agent might want: a <strong className="text-foreground">CLI</strong>{' '}
            command, an <strong className="text-foreground">MCP</strong> server, a{' '}
            <strong className="text-foreground">REST API</strong>, a typed{' '}
            <strong className="text-foreground">SDK</strong>, and a loadable{' '}
            <strong className="text-foreground">Skill</strong>.
          </p>

          <p className="text-foreground-secondary">
            Half the AI-tooling conversation in 2026 is an argument over transport — MCP is dead, MCP
            is the future, just use REST, no, use the SDK. We think that&apos;s the wrong argument.
            They&apos;re each better in a different context: CLI is best in Claude Code (fewest
            tokens, native bash), MCP in Cursor and Claude Desktop (structured tools without a
            shell), REST in your backend, the SDK in your TypeScript app, and a Skill when the agent
            needs to <em>learn</em> the tools, not just call them. So instead of picking a side,
            TPMJS lets you write (or curate) the tool once and delivers <strong className="text-foreground">all
            of them from one source of truth</strong> — and, because it also runs each tool in an
            isolated sandbox and health-scores it, you get discovery, trust, and quality on top of
            every protocol. The Model Context Protocol and its official registry are one input we
            build on, not the whole story.
          </p>

          <h2 className="text-xl font-semibold mt-10 mb-4 text-foreground">How it works</h2>

          <p className="text-foreground-secondary">
            Publish an npm package with the{' '}
            <code className="px-1.5 py-0.5 bg-surface border border-border text-sm font-mono">
              tpmjs
            </code>{' '}
            keyword and TPMJS picks it up within minutes. It extracts Zod/JSON schemas, runs health
            checks, and computes quality scores — then serves the tool through the whole surface
            area at once: a <code className="px-1 py-0.5 bg-surface border border-border text-sm font-mono">tpm</code>{' '}
            CLI command, an MCP endpoint (works with Claude Code, Cursor, Windsurf, and any compliant
            client), a REST API, a typed SDK, and a loadable skill. You can group tools into
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
                <strong className="text-foreground">One collection, every protocol.</strong> The
                same curated set is a CLI command, an MCP server URL, a REST endpoint, a typed SDK
                import, and a loadable skill. Bet on the tools, not the transport — pick the surface
                your agent works best with, or use them all, with no lock-in to any one of them.
              </span>
            </li>
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
                <strong className="text-foreground">Curated collections.</strong>{' '}
                Group the tools an agent actually needs and it&apos;s instantly live on all five
                surfaces — on-demand discovery instead of tens of thousands of tokens of schemas
                loaded into the context window up front.
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
