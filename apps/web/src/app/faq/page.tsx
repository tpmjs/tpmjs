import { Button } from '@tpmjs/ui/Button/Button';
import { Container } from '@tpmjs/ui/Container/Container';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import Link from 'next/link';
import { AppHeader } from '~/components/AppHeader';

export const metadata = {
  title: 'FAQ | TPMJS',
  description:
    'Frequently asked questions about TPMJS - Tool Package Manager for AI agents. Learn how to publish tools, understand quality scores, and get help.',
  openGraph: {
    title: 'FAQ | TPMJS',
    description:
      'Frequently asked questions about TPMJS - Tool Package Manager for AI agents. Learn how to publish tools, understand quality scores, and get help.',
    images: [{ url: '/api/og/faq', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image' as const,
    images: ['/api/og/faq'],
  },
};

interface FAQItemProps {
  question: string;
  children: React.ReactNode;
}

function FAQItem({ question, children }: FAQItemProps): React.ReactElement {
  return (
    <details className="group border border-border rounded-lg bg-surface hover:border-foreground/50 transition-colors">
      <summary className="cursor-pointer px-6 py-4 font-semibold text-foreground flex items-center justify-between list-none">
        <span className="pr-4">{question}</span>
        <span className="text-foreground-secondary group-open:rotate-180 transition-transform">
          <Icon icon="chevronDown" size="sm" />
        </span>
      </summary>
      <div className="px-6 pb-6 pt-2 text-foreground-secondary space-y-4">{children}</div>
    </details>
  );
}

export default function FAQPage(): React.ReactElement {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader />

      <main className="flex-1 py-16">
        <Container size="lg" padding="lg">
          {/* Hero */}
          <div className="text-center mb-16">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-foreground">
              Frequently Asked Questions
            </h1>
            <p className="text-xl text-foreground-secondary max-w-2xl mx-auto">
              Common questions about the registry, publishing tools, and integration.
            </p>
          </div>

          {/* FAQ Items */}
          <div className="max-w-3xl mx-auto space-y-4">
            {/* Question 1: What is TPMJS? */}
            <FAQItem question="What is TPMJS?">
              <p>
                TPMJS is a registry for AI tools published to npm. It auto-discovers packages with
                the{' '}
                <code className="text-foreground bg-background px-2 py-1 rounded border border-border">
                  tpmjs
                </code>{' '}
                keyword, extracts their schemas, scores quality, and serves them via MCP, CLI, SDK,
                and HTTP API.
              </p>
              <p>
                Think of it as npm for AI tools — with discovery, quality scoring, health checks,
                and a universal interface so any AI agent can find and run tools.
              </p>
            </FAQItem>

            {/* Question 2: How do I publish a tool? */}
            <FAQItem question="How do I publish a tool?">
              <ol className="list-decimal list-inside space-y-2 ml-4">
                <li>
                  Add{' '}
                  <code className="text-foreground bg-background px-2 py-1 rounded border border-border">
                    &quot;tpmjs&quot;
                  </code>{' '}
                  to your package.json keywords
                </li>
                <li>
                  Add a{' '}
                  <code className="text-foreground bg-background px-2 py-1 rounded border border-border">
                    tpmjs
                  </code>{' '}
                  field with at least a category
                </li>
                <li>
                  <code className="text-foreground bg-background px-2 py-1 rounded border border-border">
                    npm publish
                  </code>
                </li>
                <li>Your tool appears on tpmjs.com within 2-15 minutes</li>
              </ol>
              <p>
                Or scaffold a package instantly:{' '}
                <code className="text-foreground bg-background px-2 py-1 rounded border border-border">
                  npx @tpmjs/create-basic-tools
                </code>
              </p>
              <p>
                Full details in the{' '}
                <Link href="/publish" className="text-primary hover:underline font-medium">
                  publishing guide
                </Link>
                .
              </p>
            </FAQItem>

            {/* Question 3: How does schema extraction work? */}
            <FAQItem question="How does automatic schema extraction work?">
              <p>
                TPMJS automatically extracts your tool&apos;s input schema (parameters) by loading
                and analyzing your tool code in a sandboxed environment. This means you don&apos;t
                need to manually document parameters in package.json.
              </p>
              <ul className="space-y-3">
                <li>
                  <strong className="text-foreground">During sync</strong> - When your package is
                  discovered or updated, TPMJS loads it via esm.sh and reads the inputSchema from
                  your exported tool.
                </li>
                <li>
                  <strong className="text-foreground">Schema source badge</strong> - Tool pages show
                  whether the schema was &quot;Auto-extracted&quot; or &quot;Author-provided&quot;
                  (fallback).
                </li>
                <li>
                  <strong className="text-foreground">Manual re-extraction</strong> - Users can
                  trigger re-extraction from the tool page if needed.
                </li>
              </ul>
              <p>
                This simplifies publishing - you only need to provide category, description, and
                name. See our{' '}
                <Link href="/spec" className="text-primary hover:underline font-medium">
                  specification
                </Link>{' '}
                for details.
              </p>
            </FAQItem>

            {/* Question 4: How does tool health checking work? */}
            <FAQItem question="How does tool health checking work?">
              <p>TPMJS runs two automated health checks on every tool:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  <strong className="text-foreground">Import health:</strong> Can the package be
                  loaded? Does the export exist? Is it in AI SDK format?
                </li>
                <li>
                  <strong className="text-foreground">Execution health:</strong> Can test parameters
                  be generated? Does the tool execute without errors?
                </li>
              </ul>
              <p>
                Tools that fail are flagged in the registry. Search results prioritize healthy tools
                so agents use reliable ones.
              </p>
            </FAQItem>

            {/* Question 5: What is the quality score? */}
            <FAQItem question="What is the quality score?">
              <p>
                The quality score is a calculated metric (0.0 to 1.0) that ranks tools based on
                three factors:
              </p>
              <ol className="space-y-3">
                <li>
                  <strong className="text-foreground">1. Metadata Tier (60% weight):</strong>
                  <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                    <li>Rich tier: 4x multiplier (0.6 base score)</li>
                    <li>Basic tier: 2x multiplier (0.4 base score)</li>
                    <li>Minimal tier: 1x multiplier (0.2 base score)</li>
                  </ul>
                </li>
                <li>
                  <strong className="text-foreground">2. NPM Downloads (30% weight):</strong>{' '}
                  Logarithmic scale based on monthly downloads (max 0.3 points)
                </li>
                <li>
                  <strong className="text-foreground">3. GitHub Stars (10% weight):</strong>{' '}
                  Logarithmic scale based on repository stars (max 0.1 points)
                </li>
              </ol>
              <p className="mt-3">
                Higher quality scores mean better visibility in search results. The best way to
                improve your score is to use the Rich metadata tier and maintain good documentation.
              </p>
            </FAQItem>

            {/* Question 6: Is TPMJS free to use? */}
            <FAQItem question="Is TPMJS free to use?">
              <p>
                Yes. Free and{' '}
                <a
                  href="https://github.com/tpmjs/tpmjs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  open source
                </a>
                . Publish unlimited tools, search without authentication, use tools in any
                application. No paid tiers, no usage billing.
              </p>
            </FAQItem>

            {/* Question 7: How often are tools synced from npm? */}
            <FAQItem question="How often are tools synced from npm?">
              <p>Three sync mechanisms run in parallel:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  <strong className="text-foreground">Changes feed:</strong> Monitors npm&apos;s
                  real-time stream (every 2 minutes)
                </li>
                <li>
                  <strong className="text-foreground">Keyword search:</strong> Searches for the{' '}
                  <code className="text-foreground bg-background px-2 py-1 rounded border border-border">
                    tpmjs
                  </code>{' '}
                  keyword (every 15 minutes)
                </li>
                <li>
                  <strong className="text-foreground">Metrics:</strong> Updates download stats and
                  quality scores (daily)
                </li>
              </ul>
              <p>Your tool typically appears within 2-15 minutes of publishing.</p>
            </FAQItem>

            {/* Question 8: Can I use TPMJS tools with any AI agent? */}
            <FAQItem question="Can I use TPMJS tools with any AI agent?">
              <p>
                Yes. TPMJS tools use the Vercel AI SDK{' '}
                <code className="text-foreground bg-background px-2 py-1 rounded border border-border">
                  tool()
                </code>{' '}
                format and are served via MCP — so they work with any MCP client (Claude Desktop,
                Cursor, Windsurf) and any framework (Vercel AI SDK, LangChain, custom). Tools
                specify supported frameworks in their metadata.
              </p>
            </FAQItem>

            {/* Question 9: How do I report a broken or malicious tool? */}
            <FAQItem question="How do I report a broken or malicious tool?">
              <p>If you discover a broken or malicious tool, please report it immediately:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  <strong className="text-foreground">For broken tools:</strong>{' '}
                  <a
                    href="https://github.com/tpmjs/tpmjs/issues/new?labels=broken-tool"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    File an issue on GitHub
                  </a>{' '}
                  with the tool name and what&apos;s broken
                </li>
                <li>
                  <strong className="text-foreground">For security issues:</strong> Email us
                  directly at{' '}
                  <a href="mailto:hello@tpmjs.com" className="text-primary hover:underline">
                    hello@tpmjs.com
                  </a>
                </li>
                <li>
                  <strong className="text-foreground">For npm package issues:</strong>{' '}
                  <a
                    href="https://www.npmjs.com/support"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Contact npm support
                  </a>{' '}
                  to report malicious packages
                </li>
              </ul>
              <p>
                TPMJS takes security seriously. Reported tools will be investigated and flagged or
                removed from the registry if necessary.
              </p>
            </FAQItem>

            {/* Question 10: Where can I get help? */}
            <FAQItem question="Where can I get help?">
              <ul className="space-y-3">
                <li>
                  <a
                    href="https://github.com/tpmjs/tpmjs/issues"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    GitHub Issues
                  </a>{' '}
                  — bugs, feature requests, technical questions
                </li>
                <li>
                  <a
                    href="https://github.com/tpmjs/tpmjs/discussions"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    GitHub Discussions
                  </a>{' '}
                  — general questions, community support
                </li>
                <li>
                  <a
                    href="https://twitter.com/tpmjs_registry"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    @tpmjs_registry
                  </a>{' '}
                  — updates and announcements
                </li>
                <li>
                  <a href="mailto:hello@tpmjs.com" className="text-primary hover:underline">
                    hello@tpmjs.com
                  </a>{' '}
                  — private inquiries
                </li>
              </ul>
            </FAQItem>

            {/* Question: How is this different from MCP? */}
            <FAQItem question="How is this different from MCP servers?">
              <p>
                MCP is a protocol — TPMJS is a registry that speaks it. Building a custom MCP server
                means implementing transport, JSON-RPC dispatch, schemas, auth, and deployment
                yourself. TPMJS handles all of that: publish a tool to npm and it is automatically
                served as an MCP endpoint.
              </p>
              <p>
                See the{' '}
                <Link
                  href="/compare/custom-mcp-servers"
                  className="text-primary hover:underline font-medium"
                >
                  full comparison
                </Link>
                .
              </p>
            </FAQItem>

            {/* Question: What about security? */}
            <FAQItem question="How do you handle security for tool execution?">
              <p>
                Tools execute in isolated Deno sandboxes on Railway with network restrictions,
                memory limits, and execution timeouts. Credentials are encrypted at rest and
                injected at execution time — they are never logged or stored in plaintext.
              </p>
              <p>
                You can also use a custom executor endpoint to run tools entirely on your own
                infrastructure.
              </p>
            </FAQItem>

            {/* Question: What is the tool format? */}
            <FAQItem question="What format do tools need to be in?">
              <p>
                Tools use the Vercel AI SDK{' '}
                <code className="text-foreground bg-background px-2 py-1 rounded border border-border">
                  tool()
                </code>{' '}
                function — a Zod schema for parameters and an{' '}
                <code className="text-foreground bg-background px-2 py-1 rounded border border-border">
                  execute()
                </code>{' '}
                function. This is a thin wrapper, not a framework dependency. Any export with{' '}
                <code className="text-foreground bg-background px-2 py-1 rounded border border-border">
                  description
                </code>{' '}
                +{' '}
                <code className="text-foreground bg-background px-2 py-1 rounded border border-border">
                  execute
                </code>{' '}
                properties is auto-detected.
              </p>
            </FAQItem>

            {/* Question: Can I use this without publishing to npm? */}
            <FAQItem question="Can I use TPMJS tools without the registry?">
              <p>
                Yes. TPMJS tools are standard npm packages. You can{' '}
                <code className="text-foreground bg-background px-2 py-1 rounded border border-border">
                  npm install
                </code>{' '}
                them and import them directly — no registry API calls needed. The registry adds
                discovery, MCP serving, and quality scoring on top.
              </p>
            </FAQItem>
          </div>

          {/* CTA Section */}
          <section className="mt-16 text-center py-12 px-6 border border-border rounded-lg bg-surface">
            <h2 className="text-2xl font-bold mb-4 text-foreground">Still have questions?</h2>
            <p className="text-lg text-foreground-secondary mb-6 max-w-xl mx-auto">
              Open an issue on GitHub or reach out on Twitter.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="https://github.com/tpmjs/tpmjs/issues/new"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button size="lg">Ask on GitHub</Button>
              </a>
              <a
                href="https://twitter.com/tpmjs_registry"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" size="lg">
                  Follow on Twitter
                </Button>
              </a>
            </div>
          </section>
        </Container>
      </main>
    </div>
  );
}
