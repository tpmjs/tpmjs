import { Container } from '@tpmjs/ui/Container/Container';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import type { Metadata } from 'next';
import { AppHeader } from '~/components/AppHeader';

export const metadata: Metadata = {
  title: 'About',
  description: 'About TPMJS and its creator',
};

export default function AboutPage(): React.ReactElement {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <Container size="md" padding="lg" className="py-16">
        <h1 className="text-3xl font-bold mb-8 text-foreground">About TPMJS</h1>

        <div className="prose prose-neutral dark:prose-invert max-w-none">
          <p className="text-lg text-foreground-secondary mb-6">
            TPMJS is a registry and execution layer for AI tools. It continuously scans npm for
            packages tagged as AI tools, extracts their schemas, validates them, scores their
            quality, and makes them instantly callable by any AI agent through MCP, SDK, or API.
          </p>

          <p className="text-foreground-secondary mb-6">
            The problem: AI agents are only as useful as the tools they can access, but discovering,
            validating, and connecting tools is a mess. There is no central place to find what
            exists, no standard way to know if a tool actually works, and wiring up each tool to
            each client is tedious manual config. TPMJS fixes this by treating AI tools the way npm
            treats packages — one registry, automatic quality checks, and a universal interface.
          </p>

          <h2 className="text-xl font-semibold mt-10 mb-4 text-foreground">How it works</h2>

          <p className="text-foreground-secondary mb-6">
            Publish an npm package with the right keyword and TPMJS picks it up within minutes. It
            extracts tool schemas, runs health checks, computes quality scores, and serves the tool
            via MCP endpoints that work with Claude Code, Cursor, Windsurf, and any MCP-compatible
            client. You can group tools into collections, test them with auto-generated scenarios,
            and build agents that use them — all from one place.
          </p>

          <h2 className="text-xl font-semibold mt-10 mb-4 text-foreground">Built by</h2>

          <p className="text-foreground-secondary mb-6">
            TPMJS was created by <strong>Ajax Davis</strong> (Thomas Davis) in 2024. It started as a
            side project to scratch an itch — finding usable AI tools was harder than it should be —
            and grew into a full platform.
          </p>

          <div className="flex items-center gap-6">
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
          </div>
        </div>
      </Container>
    </div>
  );
}
