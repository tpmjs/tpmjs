import { Container } from '@tpmjs/ui/Container/Container';
import Link from 'next/link';
import { AppHeader } from '~/components/AppHeader';

export const metadata = {
  title: 'Privacy Policy | TPMJS',
  description: 'Learn how TPMJS collects, uses, and protects your data',
  openGraph: {
    title: 'Privacy Policy | TPMJS',
    description: 'Learn how TPMJS collects, uses, and protects your data',
    images: [{ url: '/api/og/privacy', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image' as const,
    images: ['/api/og/privacy'],
  },
};

export default function PrivacyPage(): React.ReactElement {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader />

      <main className="flex-1 py-16">
        <Container size="lg" padding="lg">
          {/* Hero */}
          <div className="text-center mb-16">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-foreground">
              Privacy Policy
            </h1>
            <p className="text-xl text-foreground-secondary max-w-2xl mx-auto">
              How we collect, use, and protect your data
            </p>
            <p className="text-sm text-foreground-tertiary mt-4">Last updated: December 2024</p>
          </div>

          {/* Introduction */}
          <section className="mb-12">
            <p className="text-lg text-foreground-secondary leading-relaxed">
              TPMJS (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) operates tpmjs.com as a
              tool registry for AI agents. This Privacy Policy explains how we collect, use, and
              protect information when you use our service.
            </p>
          </section>

          {/* Data We Collect */}
          <section className="mb-12">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-6 text-foreground">
              What Data We Collect
            </h2>

            <div className="space-y-6">
              {/* Public NPM Data */}
              <div className="p-6 border border-border rounded-lg bg-surface">
                <h3 className="text-xl font-semibold mb-3 text-foreground">
                  Public NPM Package Metadata
                </h3>
                <p className="text-foreground-secondary mb-4">
                  We automatically collect and index public metadata from npm packages that use the{' '}
                  <code className="text-foreground bg-background px-2 py-1 rounded text-sm">
                    tpmjs
                  </code>{' '}
                  keyword. This includes:
                </p>
                <ul className="space-y-2 text-foreground-secondary">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Package name, version, and description</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Tool metadata (parameters, return types, descriptions)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Download statistics from npm registry</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>
                      Repository information (GitHub stars, README, license) when publicly available
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Publication and modification timestamps</span>
                  </li>
                </ul>
                <p className="mt-4 text-sm text-foreground-tertiary">
                  This data is already public on npm and GitHub. We do not collect any private or
                  non-public package information.
                </p>
              </div>

              {/* Usage Analytics */}
              <div className="p-6 border border-border rounded-lg bg-surface">
                <h3 className="text-xl font-semibold mb-3 text-foreground">Usage Analytics</h3>
                <p className="text-foreground-secondary mb-4">
                  We collect basic analytics to understand how visitors use our site:
                </p>
                <ul className="space-y-2 text-foreground-secondary">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Page views and navigation patterns</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Search queries and tool interactions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Browser type, device information, and screen size</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Approximate geographic location (country/region level only)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Referral sources (how you found our site)</span>
                  </li>
                </ul>
                <p className="mt-4 text-sm text-foreground-tertiary">
                  Analytics data is aggregated and anonymized. We do not track individual users
                  across sessions or devices.
                </p>
              </div>

              {/* Technical Logs */}
              <div className="p-6 border border-border rounded-lg bg-surface">
                <h3 className="text-xl font-semibold mb-3 text-foreground">
                  Technical Logs & Error Data
                </h3>
                <p className="text-foreground-secondary mb-4">
                  Our hosting infrastructure (Vercel) automatically logs:
                </p>
                <ul className="space-y-2 text-foreground-secondary">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>IP addresses (retained for 7 days for security purposes)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Request timestamps and response times</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>API usage patterns and rate limiting data</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Error messages and stack traces (for debugging)</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* What We Don't Collect */}
          <section className="mb-12">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-6 text-foreground">
              What We Don&apos;t Collect
            </h2>
            <div className="p-6 border border-success/20 rounded-lg bg-success/5">
              <ul className="space-y-3 text-foreground-secondary">
                <li className="flex items-start gap-2">
                  <span className="text-success mt-1">✓</span>
                  <span>
                    <strong className="text-foreground">No user accounts:</strong> TPMJS does not
                    currently require user registration or login
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-success mt-1">✓</span>
                  <span>
                    <strong className="text-foreground">No personal information:</strong> We
                    don&apos;t collect names, email addresses, or contact details (unless you
                    voluntarily email us)
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-success mt-1">✓</span>
                  <span>
                    <strong className="text-foreground">No tracking cookies:</strong> We don&apos;t
                    use third-party advertising or behavioral tracking cookies
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-success mt-1">✓</span>
                  <span>
                    <strong className="text-foreground">No sensitive data:</strong> We don&apos;t
                    collect payment information, social security numbers, or other sensitive
                    personal data
                  </span>
                </li>
              </ul>
            </div>
          </section>

          {/* How We Use Data */}
          <section className="mb-12">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-6 text-foreground">
              How We Use Your Data
            </h2>
            <div className="space-y-4">
              <div className="p-6 border border-border rounded-lg bg-surface">
                <h3 className="text-xl font-semibold mb-3 text-foreground">
                  Operating the Service
                </h3>
                <ul className="space-y-2 text-foreground-secondary">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Indexing and displaying npm package information</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Calculating quality scores and health checks</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Providing search and discovery functionality</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Executing tools in our playground environment</span>
                  </li>
                </ul>
              </div>

              <div className="p-6 border border-border rounded-lg bg-surface">
                <h3 className="text-xl font-semibold mb-3 text-foreground">
                  Improving the Service
                </h3>
                <ul className="space-y-2 text-foreground-secondary">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Understanding which tools and features are most popular</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Identifying and fixing bugs and performance issues</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Optimizing search relevance and ranking algorithms</span>
                  </li>
                </ul>
              </div>

              <div className="p-6 border border-border rounded-lg bg-surface">
                <h3 className="text-xl font-semibold mb-3 text-foreground">Security</h3>
                <ul className="space-y-2 text-foreground-secondary">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Preventing abuse, spam, and malicious activity</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Rate limiting API requests to ensure fair usage</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Detecting and blocking DDoS attacks</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Third-Party Services */}
          <section className="mb-12">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-6 text-foreground">
              Third-Party Services
            </h2>
            <p className="text-foreground-secondary mb-6">
              TPMJS relies on the following third-party services to operate:
            </p>

            <div className="space-y-4">
              <div className="p-6 border border-border rounded-lg bg-surface">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <h3 className="text-xl font-semibold text-foreground">Vercel</h3>
                  <span className="text-xs px-2 py-1 rounded bg-foreground/10 text-foreground-secondary">
                    Hosting
                  </span>
                </div>
                <p className="text-foreground-secondary mb-2">
                  Our website and API are hosted on Vercel&apos;s infrastructure.
                </p>
                <p className="text-sm text-foreground-tertiary">
                  Privacy Policy:{' '}
                  <a
                    href="https://vercel.com/legal/privacy-policy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    vercel.com/legal/privacy-policy
                  </a>
                </p>
              </div>

              <div className="p-6 border border-border rounded-lg bg-surface">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <h3 className="text-xl font-semibold text-foreground">Neon</h3>
                  <span className="text-xs px-2 py-1 rounded bg-foreground/10 text-foreground-secondary">
                    Database
                  </span>
                </div>
                <p className="text-foreground-secondary mb-2">
                  Tool metadata and sync data are stored in a PostgreSQL database hosted on Neon.
                </p>
                <p className="text-sm text-foreground-tertiary">
                  Privacy Policy:{' '}
                  <a
                    href="https://neon.tech/privacy-policy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    neon.tech/privacy-policy
                  </a>
                </p>
              </div>

              <div className="p-6 border border-border rounded-lg bg-surface">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <h3 className="text-xl font-semibold text-foreground">NPM Registry</h3>
                  <span className="text-xs px-2 py-1 rounded bg-foreground/10 text-foreground-secondary">
                    Data Source
                  </span>
                </div>
                <p className="text-foreground-secondary mb-2">
                  Package metadata is sourced from the public npm registry.
                </p>
                <p className="text-sm text-foreground-tertiary">
                  Privacy Policy:{' '}
                  <a
                    href="https://docs.npmjs.com/policies/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    docs.npmjs.com/policies/privacy
                  </a>
                </p>
              </div>

              <div className="p-6 border border-border rounded-lg bg-surface">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <h3 className="text-xl font-semibold text-foreground">Railway</h3>
                  <span className="text-xs px-2 py-1 rounded bg-foreground/10 text-foreground-secondary">
                    Sandbox Execution
                  </span>
                </div>
                <p className="text-foreground-secondary mb-2">
                  The playground uses Railway to execute tools in isolated Deno environments.
                </p>
                <p className="text-sm text-foreground-tertiary">
                  Privacy Policy:{' '}
                  <a
                    href="https://railway.app/legal/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    railway.app/legal/privacy
                  </a>
                </p>
              </div>
            </div>
          </section>

          {/* Data Retention */}
          <section className="mb-12">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-6 text-foreground">
              Data Retention
            </h2>
            <div className="space-y-4 text-foreground-secondary">
              <div className="p-6 border border-border rounded-lg bg-surface">
                <h3 className="text-lg font-semibold mb-2 text-foreground">NPM Package Metadata</h3>
                <p>
                  Retained indefinitely to provide historical context and maintain package listings.
                  Updated automatically when packages are republished or metadata changes.
                </p>
              </div>

              <div className="p-6 border border-border rounded-lg bg-surface">
                <h3 className="text-lg font-semibold mb-2 text-foreground">Analytics Data</h3>
                <p>Aggregated analytics are retained for up to 90 days.</p>
              </div>

              <div className="p-6 border border-border rounded-lg bg-surface">
                <h3 className="text-lg font-semibold mb-2 text-foreground">Server Logs</h3>
                <p>
                  Technical logs including IP addresses are automatically deleted after 7 days per
                  Vercel&apos;s retention policy.
                </p>
              </div>
            </div>
          </section>

          {/* Your Rights (GDPR) */}
          <section className="mb-12">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-6 text-foreground">
              Your Rights (GDPR Compliance)
            </h2>
            <p className="text-foreground-secondary mb-6">
              If you are in the European Union, you have the following rights under GDPR:
            </p>

            <div className="space-y-3">
              <div className="p-4 border border-border rounded-lg bg-surface">
                <h3 className="font-semibold text-foreground mb-2">Right to Access</h3>
                <p className="text-sm text-foreground-secondary">
                  Request a copy of any personal data we hold about you.
                </p>
              </div>

              <div className="p-4 border border-border rounded-lg bg-surface">
                <h3 className="font-semibold text-foreground mb-2">Right to Rectification</h3>
                <p className="text-sm text-foreground-secondary">
                  Request correction of inaccurate data. Note: NPM package data is sourced from npm;
                  corrections must be made by republishing the package.
                </p>
              </div>

              <div className="p-4 border border-border rounded-lg bg-surface">
                <h3 className="font-semibold text-foreground mb-2">Right to Erasure</h3>
                <p className="text-sm text-foreground-secondary">
                  Request deletion of your data. To remove a tool from TPMJS, unpublish it from npm
                  or remove the{' '}
                  <code className="text-xs bg-background px-1 py-0.5 rounded">tpmjs</code> keyword.
                </p>
              </div>

              <div className="p-4 border border-border rounded-lg bg-surface">
                <h3 className="font-semibold text-foreground mb-2">Right to Object</h3>
                <p className="text-sm text-foreground-secondary">
                  Object to processing of your data for specific purposes (e.g., analytics).
                </p>
              </div>

              <div className="p-4 border border-border rounded-lg bg-surface">
                <h3 className="font-semibold text-foreground mb-2">Right to Data Portability</h3>
                <p className="text-sm text-foreground-secondary">
                  Request a machine-readable copy of data about your packages. All package data is
                  already available via our public API.
                </p>
              </div>
            </div>

            <p className="mt-6 text-foreground-secondary">
              To exercise any of these rights, contact us at{' '}
              <a href="mailto:hello@tpmjs.com" className="text-primary hover:underline font-medium">
                hello@tpmjs.com
              </a>
              . We will respond within 30 days.
            </p>
          </section>

          {/* Cookies */}
          <section className="mb-12">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-6 text-foreground">
              Cookies & Local Storage
            </h2>
            <p className="text-foreground-secondary mb-4">
              TPMJS uses minimal cookies and local storage:
            </p>

            <div className="space-y-3">
              <div className="p-4 border border-border rounded-lg bg-surface">
                <h3 className="font-semibold text-foreground mb-2">Essential Cookies</h3>
                <p className="text-sm text-foreground-secondary mb-2">
                  Used for basic site functionality (theme preferences, session state). These cannot
                  be disabled.
                </p>
                <p className="text-xs text-foreground-tertiary">
                  Examples: theme preference (light/dark mode)
                </p>
              </div>

              <div className="p-4 border border-border rounded-lg bg-surface">
                <h3 className="font-semibold text-foreground mb-2">Local Storage</h3>
                <p className="text-sm text-foreground-secondary">
                  Playground conversation history is stored locally in your browser and never sent
                  to our servers.
                </p>
              </div>
            </div>

            <p className="mt-4 text-sm text-foreground-tertiary">
              We do not use third-party advertising or tracking cookies.
            </p>
          </section>

          {/* Data Security */}
          <section className="mb-12">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-6 text-foreground">
              Data Security
            </h2>
            <p className="text-foreground-secondary mb-4">
              We take reasonable measures to protect data from unauthorized access:
            </p>
            <ul className="space-y-2 text-foreground-secondary">
              <li className="flex items-start gap-2">
                <span className="text-success mt-1">✓</span>
                <span>All data in transit is encrypted via HTTPS/TLS</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-success mt-1">✓</span>
                <span>Database connections use encrypted connections</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-success mt-1">✓</span>
                <span>API endpoints are protected with rate limiting</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-success mt-1">✓</span>
                <span>Tool execution happens in isolated sandbox environments</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-success mt-1">✓</span>
                <span>Regular security updates and dependency scanning</span>
              </li>
            </ul>

            <p className="mt-4 text-sm text-foreground-tertiary">
              However, no method of transmission over the Internet is 100% secure. We cannot
              guarantee absolute security.
            </p>
          </section>

          {/* Children's Privacy */}
          <section className="mb-12">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-6 text-foreground">
              Children&apos;s Privacy
            </h2>
            <p className="text-foreground-secondary">
              TPMJS does not knowingly collect information from children under 13. The service is
              intended for developers and AI practitioners. If you believe we have inadvertently
              collected data from a child under 13, please contact us immediately.
            </p>
          </section>

          {/* Changes to Policy */}
          <section className="mb-12">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-6 text-foreground">
              Changes to This Policy
            </h2>
            <p className="text-foreground-secondary">
              We may update this Privacy Policy from time to time. Changes will be posted on this
              page with an updated &quot;Last updated&quot; date. Continued use of TPMJS after
              changes constitutes acceptance of the updated policy.
            </p>
          </section>

          {/* Contact */}
          <section className="mb-12">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-6 text-foreground">
              Contact Us
            </h2>
            <p className="text-foreground-secondary mb-4">
              If you have questions or concerns about this Privacy Policy or how we handle your
              data, please contact us:
            </p>

            <div className="p-6 border border-border rounded-lg bg-surface">
              <div className="space-y-3">
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Email</h3>
                  <a href="mailto:hello@tpmjs.com" className="text-primary hover:underline">
                    hello@tpmjs.com
                  </a>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-1">GitHub</h3>
                  <a
                    href="https://github.com/tpmjs/tpmjs/issues"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    github.com/tpmjs/tpmjs/issues
                  </a>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-1">Website</h3>
                  <Link href="/" className="text-primary hover:underline">
                    tpmjs.com
                  </Link>
                </div>
              </div>
            </div>
          </section>

          {/* Summary */}
          <section className="p-8 border-2 border-primary/20 rounded-lg bg-primary/5">
            <h2 className="text-2xl font-bold mb-4 text-foreground">In Summary</h2>
            <ul className="space-y-2 text-foreground-secondary">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>We collect public npm package data and basic usage analytics</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>We don&apos;t require user accounts or collect personal information</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>We don&apos;t sell or share your data with third parties for marketing</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>We use industry-standard security practices</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>You have rights under GDPR if you&apos;re in the EU</span>
              </li>
            </ul>
          </section>
        </Container>
      </main>
    </div>
  );
}
