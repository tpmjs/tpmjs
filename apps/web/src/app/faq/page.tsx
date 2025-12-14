import { Container } from '@tpmjs/ui/Container/Container';
import Link from 'next/link';
import { AppHeader } from '~/components/AppHeader';

export const metadata = {
  title: 'FAQ | TPMJS',
  description:
    'Frequently asked questions about TPMJS - Tool Package Manager for AI agents. Learn how to publish tools, understand quality scores, and get help.',
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
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M5 7.5L10 12.5L15 7.5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
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
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
              Frequently Asked Questions
            </h1>
            <p className="text-xl text-foreground-secondary max-w-2xl mx-auto">
              Everything you need to know about publishing, using, and contributing to the TPMJS
              registry.
            </p>
          </div>

          {/* FAQ Items */}
          <div className="max-w-3xl mx-auto space-y-4">
            {/* Question 1: What is TPMJS? */}
            <FAQItem question="What is TPMJS?">
              <p>
                TPMJS (Tool Package Manager for JavaScript) is a registry and discovery platform for
                AI agent tools. It helps developers publish, share, and discover tools that can be
                used by AI agents to perform tasks like text analysis, code generation, data
                processing, and more.
              </p>
              <p>
                Think of it as npm for AI tools. Developers publish tools to npm with the{' '}
                <code className="text-foreground bg-background px-2 py-1 rounded border border-border">
                  tpmjs-tool
                </code>{' '}
                keyword, and TPMJS automatically syncs them to our registry where they can be
                discovered by AI agents and developers.
              </p>
            </FAQItem>

            {/* Question 2: How do I publish a tool? */}
            <FAQItem question="How do I publish a tool?">
              <p>Publishing a tool to TPMJS is simple:</p>
              <ol className="list-decimal list-inside space-y-2 ml-4">
                <li>
                  Add the{' '}
                  <code className="text-foreground bg-background px-2 py-1 rounded border border-border">
                    tpmjs-tool
                  </code>{' '}
                  keyword to your package.json
                </li>
                <li>
                  Add a{' '}
                  <code className="text-foreground bg-background px-2 py-1 rounded border border-border">
                    tpmjs
                  </code>{' '}
                  field with metadata (category, frameworks, tools)
                </li>
                <li>Publish your package to npm</li>
                <li>Your tool appears on tpmjs.com within 15 minutes</li>
              </ol>
              <p>
                For detailed instructions, check out our{' '}
                <Link href="/publish" className="text-primary hover:underline font-medium">
                  publishing guide
                </Link>
                . We also provide a package generator to get started quickly:
              </p>
              <code className="block text-foreground bg-background px-4 py-2 rounded border border-border mt-2">
                npx @tpmjs/create-basic-tools
              </code>
            </FAQItem>

            {/* Question 3: What are the metadata tiers? */}
            <FAQItem question="What are the metadata tiers (minimal, rich)?">
              <p>
                TPMJS supports three metadata tiers, each providing different levels of detail and
                affecting your tool&apos;s quality score:
              </p>
              <ul className="space-y-3">
                <li>
                  <strong className="text-foreground">Tier 1: Minimal (1x multiplier)</strong> -
                  Basic metadata with category, frameworks, and simple tool descriptions. Quick to
                  set up but lower visibility.
                </li>
                <li>
                  <strong className="text-foreground">Tier 2: Basic (2x multiplier)</strong> - Adds
                  parameter and return type information, helping AI agents understand how to use
                  your tool.
                </li>
                <li>
                  <strong className="text-foreground">Tier 3: Rich (4x multiplier)</strong> - Full
                  documentation including AI agent guidance, use cases, limitations, examples, and
                  environment variables. Gets the best visibility and quality score.
                </li>
              </ul>
              <p>
                Higher tiers get better quality scores and more visibility in search results. Learn
                more on our{' '}
                <Link href="/publish" className="text-primary hover:underline font-medium">
                  publishing guide
                </Link>
                .
              </p>
            </FAQItem>

            {/* Question 4: How does tool health checking work? */}
            <FAQItem question="How does tool health checking work?">
              <p>
                TPMJS automatically monitors the health of all tools in the registry by periodically
                checking:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  <strong className="text-foreground">Package availability:</strong> Verifies the
                  package still exists on npm
                </li>
                <li>
                  <strong className="text-foreground">Metadata validity:</strong> Ensures the tpmjs
                  field meets schema requirements
                </li>
                <li>
                  <strong className="text-foreground">Version freshness:</strong> Checks if the tool
                  is being actively maintained
                </li>
              </ul>
              <p>
                Tools that fail health checks are flagged on the registry and may be hidden from
                search results until the issues are resolved. This ensures AI agents only use
                reliable, well-maintained tools.
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
                Yes, TPMJS is completely free and open source for both publishers and users. You
                can:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Publish unlimited tools to the registry</li>
                <li>Browse and search all tools without authentication</li>
                <li>Use tools in your AI agents and applications</li>
                <li>
                  Contribute to the project on{' '}
                  <a
                    href="https://github.com/tpmjs/tpmjs"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    GitHub
                  </a>
                </li>
              </ul>
              <p>
                There are no paid tiers, rate limits, or premium features. TPMJS is funded by the
                community and maintained as a public good for the AI ecosystem.
              </p>
            </FAQItem>

            {/* Question 7: How often are tools synced from npm? */}
            <FAQItem question="How often are tools synced from npm?">
              <p>TPMJS uses multiple automated sync strategies to keep the registry up-to-date:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  <strong className="text-foreground">Changes Feed Sync (every 2 minutes):</strong>{' '}
                  Monitors npm&apos;s real-time changes feed to catch new packages and updates
                  immediately
                </li>
                <li>
                  <strong className="text-foreground">Keyword Search (every 15 minutes):</strong>{' '}
                  Actively searches for packages with the{' '}
                  <code className="text-foreground bg-background px-2 py-1 rounded border border-border">
                    tpmjs-tool
                  </code>{' '}
                  keyword
                </li>
                <li>
                  <strong className="text-foreground">Metrics Sync (every hour):</strong> Updates
                  download statistics and recalculates quality scores
                </li>
              </ul>
              <p>
                This means your tool will typically appear on tpmjs.com within 2-15 minutes of
                publishing to npm, with metrics updating hourly.
              </p>
            </FAQItem>

            {/* Question 8: Can I use TPMJS tools with any AI agent? */}
            <FAQItem question="Can I use TPMJS tools with any AI agent?">
              <p>
                Yes! TPMJS tools are framework-agnostic and can be used with any AI agent system.
                Each tool package specifies which frameworks it officially supports in the{' '}
                <code className="text-foreground bg-background px-2 py-1 rounded border border-border">
                  frameworks
                </code>{' '}
                field, such as:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Vercel AI SDK (vercel-ai)</li>
                <li>LangChain (langchain)</li>
                <li>OpenAI Function Calling</li>
                <li>Claude Tool Use</li>
                <li>Custom frameworks</li>
              </ul>
              <p>
                Many tools provide adapter functions for multiple frameworks. Check the tool&apos;s
                documentation for specific integration examples. Tools with Rich metadata tier
                include detailed usage guidance for AI agents.
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
                  <a
                    href="mailto:thomasalwyndavis@gmail.com"
                    className="text-primary hover:underline"
                  >
                    thomasalwyndavis@gmail.com
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
              <p>We&apos;re here to help! Here are the best ways to get support:</p>
              <ul className="space-y-3">
                <li>
                  <strong className="text-foreground">GitHub Issues:</strong>{' '}
                  <a
                    href="https://github.com/tpmjs/tpmjs/issues"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    File an issue
                  </a>{' '}
                  for bugs, feature requests, or technical questions
                </li>
                <li>
                  <strong className="text-foreground">GitHub Discussions:</strong>{' '}
                  <a
                    href="https://github.com/tpmjs/tpmjs/discussions"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Join the discussion
                  </a>{' '}
                  for general questions and community support
                </li>
                <li>
                  <strong className="text-foreground">Twitter:</strong> Follow{' '}
                  <a
                    href="https://twitter.com/tpmjs_registry"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    @tpmjs_registry
                  </a>{' '}
                  for updates and announcements
                </li>
                <li>
                  <strong className="text-foreground">Email:</strong> Contact us at{' '}
                  <a
                    href="mailto:thomasalwyndavis@gmail.com"
                    className="text-primary hover:underline"
                  >
                    thomasalwyndavis@gmail.com
                  </a>{' '}
                  for private inquiries
                </li>
              </ul>
              <p>
                We also recommend checking out our{' '}
                <Link href="/publish" className="text-primary hover:underline font-medium">
                  publishing guide
                </Link>{' '}
                and{' '}
                <Link href="/spec" className="text-primary hover:underline font-medium">
                  specification docs
                </Link>{' '}
                for detailed technical documentation.
              </p>
            </FAQItem>
          </div>

          {/* CTA Section */}
          <section className="mt-16 text-center py-12 px-6 border border-border rounded-lg bg-surface">
            <h2 className="text-2xl font-bold mb-4 text-foreground">Still have questions?</h2>
            <p className="text-lg text-foreground-secondary mb-6 max-w-xl mx-auto">
              Can&apos;t find what you&apos;re looking for? Reach out to us on GitHub or Twitter and
              we&apos;ll be happy to help.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="https://github.com/tpmjs/tpmjs/issues/new"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors"
              >
                Ask on GitHub
              </a>
              <a
                href="https://twitter.com/tpmjs_registry"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-6 py-3 border border-border bg-background text-foreground font-semibold rounded-lg hover:border-foreground transition-colors"
              >
                Follow on Twitter
              </a>
            </div>
          </section>
        </Container>
      </main>
    </div>
  );
}
