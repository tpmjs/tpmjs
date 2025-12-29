import { Container } from '@tpmjs/ui/Container/Container';
import Link from 'next/link';
import { AppHeader } from '~/components/AppHeader';

export const metadata = {
  title: 'Terms of Service | TPMJS',
  description: 'Terms of Service for TPMJS - the registry and execution platform for AI tools',
  openGraph: {
    title: 'Terms of Service | TPMJS',
    description: 'Terms of Service for TPMJS - the registry and execution platform for AI tools',
    images: [{ url: '/api/og/terms', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image' as const,
    images: ['/api/og/terms'],
  },
};

export default function TermsPage(): React.ReactElement {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader />

      <main className="flex-1 py-16">
        <Container size="lg" padding="lg">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-foreground">
              Terms of Service
            </h1>
            <p className="text-lg text-foreground-secondary">Last updated: December 2024</p>
          </div>

          {/* Content */}
          <div className="prose prose-invert max-w-none">
            {/* 1. Introduction */}
            <section className="mb-12">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 text-foreground">
                1. Introduction
              </h2>
              <div className="space-y-4 text-lg text-foreground-secondary">
                <p>
                  Welcome to TPMJS (Tool Package Manager for JavaScript). By accessing or using
                  tpmjs.com (the &quot;Service&quot;), you agree to be bound by these Terms of
                  Service (&quot;Terms&quot;). If you do not agree to these Terms, please do not use
                  the Service.
                </p>
                <p>
                  TPMJS is a registry and execution platform for AI tools that automatically
                  discovers, catalogs, and enables the execution of tools published to the npm
                  ecosystem.
                </p>
              </div>
            </section>

            {/* 2. Service Description */}
            <section className="mb-12">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 text-foreground">
                2. Service Description
              </h2>
              <div className="space-y-4 text-lg text-foreground-secondary">
                <p>TPMJS provides the following services:</p>
                <ul className="list-disc pl-4 sm:pl-6 space-y-2">
                  <li>
                    Automatic discovery and indexing of npm packages with the{' '}
                    <code className="text-foreground bg-surface px-2 py-1 rounded">tpmjs</code>{' '}
                    keyword
                  </li>
                  <li>A searchable registry of AI tools with quality scoring and health checks</li>
                  <li>APIs for searching, discovering, and executing tools</li>
                  <li>
                    A playground environment for testing tools before integration into AI agents
                  </li>
                  <li>Documentation and guides for publishing and using tools</li>
                </ul>
                <p>
                  The Service is provided free of charge and is designed to facilitate the
                  development and use of AI agent tools within the JavaScript ecosystem.
                </p>
              </div>
            </section>

            {/* 3. User Responsibilities */}
            <section className="mb-12">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 text-foreground">
                3. User Responsibilities When Publishing Tools
              </h2>
              <div className="space-y-4 text-lg text-foreground-secondary">
                <p>
                  If you publish a tool package to npm with the intention of it being indexed by
                  TPMJS, you agree to:
                </p>
                <ul className="list-disc pl-4 sm:pl-6 space-y-2">
                  <li>
                    Provide accurate and complete metadata in the{' '}
                    <code className="text-foreground bg-surface px-2 py-1 rounded">tpmjs</code>{' '}
                    field of your package.json
                  </li>
                  <li>Ensure your tool functions as described in its documentation and metadata</li>
                  <li>Not publish malicious, harmful, or intentionally broken code</li>
                  <li>
                    Not violate any third-party rights, including intellectual property rights
                  </li>
                  <li>Comply with all applicable laws and regulations</li>
                  <li>
                    Respect the npm Terms of Service and the open-source licenses of any
                    dependencies you use
                  </li>
                  <li>
                    Clearly document any environment variables, API keys, or other requirements
                    needed for your tool to function
                  </li>
                  <li>
                    Not use the Service to distribute spam, phishing attempts, or other abusive
                    content
                  </li>
                </ul>
                <p className="pt-4">
                  TPMJS reserves the right to remove any tool from the registry that violates these
                  Terms or is determined to be harmful, malicious, or otherwise inappropriate.
                </p>
              </div>
            </section>

            {/* 4. No Warranties on Third-Party Tools */}
            <section className="mb-12">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 text-foreground">
                4. No Warranties on Third-Party Tools
              </h2>
              <div className="space-y-4 text-lg text-foreground-secondary">
                <p>
                  TPMJS acts as a discovery and execution platform for tools published by
                  third-party developers. We do not develop, maintain, or endorse most tools in the
                  registry (except those explicitly marked as{' '}
                  <span className="text-foreground font-semibold">official</span>).
                </p>
                <p className="font-semibold text-foreground">
                  Important: Third-party tools are provided &quot;as is&quot; without any warranties
                  of any kind.
                </p>
                <p>We make no representations or warranties regarding:</p>
                <ul className="list-disc pl-4 sm:pl-6 space-y-2">
                  <li>The functionality, quality, or reliability of third-party tools</li>
                  <li>The accuracy or completeness of tool descriptions and metadata</li>
                  <li>The security or safety of executing third-party tools</li>
                  <li>The availability or uptime of third-party tools or their dependencies</li>
                  <li>
                    Whether third-party tools will meet your specific requirements or expectations
                  </li>
                </ul>
                <p className="pt-4">
                  While we perform automated health checks and quality scoring, these are provided
                  for informational purposes only and do not constitute a guarantee of tool quality
                  or functionality.
                </p>
                <p>
                  You are solely responsible for evaluating and testing any tools before using them
                  in production environments.
                </p>
              </div>
            </section>

            {/* 5. Limitation of Liability */}
            <section className="mb-12">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 text-foreground">
                5. Limitation of Liability
              </h2>
              <div className="space-y-4 text-lg text-foreground-secondary">
                <p className="font-semibold text-foreground">
                  TO THE MAXIMUM EXTENT PERMITTED BY LAW, TPMJS AND ITS OPERATORS SHALL NOT BE
                  LIABLE FOR ANY DAMAGES ARISING FROM YOUR USE OF THE SERVICE OR ANY TOOLS ACCESSED
                  THROUGH THE SERVICE.
                </p>
                <p>This includes, but is not limited to:</p>
                <ul className="list-disc pl-4 sm:pl-6 space-y-2">
                  <li>Direct, indirect, incidental, special, consequential, or punitive damages</li>
                  <li>Loss of profits, revenue, data, or business opportunities</li>
                  <li>
                    Damages resulting from errors, bugs, or security vulnerabilities in third-party
                    tools
                  </li>
                  <li>
                    Damages resulting from the unavailability or interruption of the Service or any
                    tools
                  </li>
                  <li>
                    Damages resulting from unauthorized access to or alteration of your data or
                    transmissions
                  </li>
                  <li>Any other damages arising from the use or inability to use the Service</li>
                </ul>
                <p className="pt-4">
                  In jurisdictions that do not allow the exclusion or limitation of liability for
                  consequential or incidental damages, our liability is limited to the maximum
                  extent permitted by law.
                </p>
              </div>
            </section>

            {/* 6. Acceptable Use Policy */}
            <section className="mb-12">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 text-foreground">
                6. Acceptable Use Policy
              </h2>
              <div className="space-y-4 text-lg text-foreground-secondary">
                <p>You agree not to use the Service to:</p>
                <ul className="list-disc pl-4 sm:pl-6 space-y-2">
                  <li>Violate any applicable laws, regulations, or third-party rights</li>
                  <li>Distribute malware, viruses, or other harmful code</li>
                  <li>
                    Attempt to gain unauthorized access to the Service, other users&apos; accounts,
                    or computer systems
                  </li>
                  <li>
                    Interfere with or disrupt the Service or servers or networks connected to the
                    Service
                  </li>
                  <li>
                    Scrape, crawl, or otherwise extract data from the Service using automated means
                    without our express written permission (reasonable API usage is permitted)
                  </li>
                  <li>
                    Impersonate any person or entity or falsely state or misrepresent your
                    affiliation with a person or entity
                  </li>
                  <li>
                    Use the Service to send spam, phishing attempts, or other unsolicited messages
                  </li>
                  <li>
                    Reverse engineer, decompile, or disassemble any portion of the Service (except
                    as permitted by open-source licenses)
                  </li>
                </ul>
              </div>
            </section>

            {/* 7. Intellectual Property */}
            <section className="mb-12">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 text-foreground">
                7. Intellectual Property
              </h2>
              <div className="space-y-4 text-lg text-foreground-secondary">
                <p>
                  The TPMJS Service, including its design, code, and documentation, is protected by
                  copyright and other intellectual property laws. Tools indexed by TPMJS remain the
                  property of their respective authors and are subject to their own licenses.
                </p>
                <p>
                  By publishing a tool to npm with the{' '}
                  <code className="text-foreground bg-surface px-2 py-1 rounded">tpmjs</code>{' '}
                  keyword, you grant TPMJS a non-exclusive, worldwide, royalty-free license to:
                </p>
                <ul className="list-disc pl-4 sm:pl-6 space-y-2">
                  <li>Index and display your tool&apos;s metadata on tpmjs.com</li>
                  <li>
                    Execute your tool in our sandbox environment for testing and demonstration
                  </li>
                  <li>Cache and serve your tool&apos;s documentation and examples</li>
                </ul>
                <p className="pt-4">
                  This license does not affect the license under which you publish your tool to npm.
                  You retain all ownership rights to your code.
                </p>
              </div>
            </section>

            {/* 8. Privacy and Data */}
            <section className="mb-12">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 text-foreground">
                8. Privacy and Data
              </h2>
              <div className="space-y-4 text-lg text-foreground-secondary">
                <p>
                  TPMJS collects and processes data necessary to operate the Service, including:
                </p>
                <ul className="list-disc pl-4 sm:pl-6 space-y-2">
                  <li>Package metadata from npm (names, versions, descriptions, etc.)</li>
                  <li>Download statistics and quality metrics from public npm registries</li>
                  <li>Tool execution results and health check data</li>
                  <li>Usage analytics to improve the Service (anonymized where possible)</li>
                </ul>
                <p className="pt-4">
                  We do not collect personally identifiable information unless you contact us
                  directly (e.g., via email). We do not sell or share your data with third parties
                  for marketing purposes.
                </p>
              </div>
            </section>

            {/* 9. Modifications to the Service */}
            <section className="mb-12">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 text-foreground">
                9. Modifications to the Service
              </h2>
              <div className="space-y-4 text-lg text-foreground-secondary">
                <p>
                  TPMJS reserves the right to modify, suspend, or discontinue the Service (or any
                  part thereof) at any time, with or without notice. We will not be liable to you or
                  any third party for any modification, suspension, or discontinuance of the
                  Service.
                </p>
                <p>
                  We may also update these Terms from time to time. Continued use of the Service
                  after such changes constitutes your acceptance of the new Terms.
                </p>
              </div>
            </section>

            {/* 10. Termination */}
            <section className="mb-12">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 text-foreground">
                10. Termination
              </h2>
              <div className="space-y-4 text-lg text-foreground-secondary">
                <p>
                  TPMJS reserves the right to terminate or suspend your access to the Service at any
                  time, without notice, for conduct that we believe violates these Terms or is
                  harmful to other users, us, or third parties, or for any other reason at our sole
                  discretion.
                </p>
                <p>
                  You may stop using the Service at any time. If you have published tools, they will
                  remain in the registry unless you remove the{' '}
                  <code className="text-foreground bg-surface px-2 py-1 rounded">tpmjs</code>{' '}
                  keyword from your package or unpublish your package from npm.
                </p>
              </div>
            </section>

            {/* 11. Governing Law */}
            <section className="mb-12">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 text-foreground">
                11. Governing Law
              </h2>
              <div className="space-y-4 text-lg text-foreground-secondary">
                <p>
                  These Terms shall be governed by and construed in accordance with the laws of the
                  jurisdiction in which TPMJS operates, without regard to its conflict of law
                  provisions.
                </p>
                <p>
                  Any disputes arising from these Terms or your use of the Service shall be resolved
                  in the courts of competent jurisdiction in that location.
                </p>
              </div>
            </section>

            {/* 12. Disclaimer */}
            <section className="mb-12">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 text-foreground">
                12. Disclaimer
              </h2>
              <div className="space-y-4 text-lg text-foreground-secondary">
                <p className="font-semibold text-foreground">
                  THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT
                  WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING, BUT NOT LIMITED TO,
                  IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND
                  NON-INFRINGEMENT.
                </p>
                <p>
                  TPMJS does not warrant that the Service will be uninterrupted, secure, or
                  error-free, or that any defects will be corrected. You use the Service at your own
                  risk.
                </p>
              </div>
            </section>

            {/* 13. Open Source */}
            <section className="mb-12">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 text-foreground">
                13. Open Source
              </h2>
              <div className="space-y-4 text-lg text-foreground-secondary">
                <p>
                  TPMJS is open source and available on{' '}
                  <a
                    href="https://github.com/tpmjs/tpmjs"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    GitHub
                  </a>
                  . The source code is provided under the license specified in the repository.
                </p>
                <p>
                  Contributions to the TPMJS project are welcome and subject to the project&apos;s
                  contribution guidelines and license terms.
                </p>
              </div>
            </section>

            {/* 14. Contact */}
            <section className="mb-12">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 text-foreground">
                14. Contact
              </h2>
              <div className="space-y-4 text-lg text-foreground-secondary">
                <p>
                  If you have any questions about these Terms or the Service, please contact us at:
                </p>
                <p>
                  <a
                    href="mailto:hello@tpmjs.com"
                    className="text-primary hover:underline font-medium"
                  >
                    hello@tpmjs.com
                  </a>
                </p>
              </div>
            </section>

            {/* 15. Severability */}
            <section className="mb-12">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 text-foreground">
                15. Severability
              </h2>
              <div className="space-y-4 text-lg text-foreground-secondary">
                <p>
                  If any provision of these Terms is found to be invalid or unenforceable, the
                  remaining provisions will remain in full force and effect. The invalid or
                  unenforceable provision will be replaced with a valid provision that most closely
                  matches the intent of the original provision.
                </p>
              </div>
            </section>

            {/* 16. Entire Agreement */}
            <section className="mb-12">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 text-foreground">
                16. Entire Agreement
              </h2>
              <div className="space-y-4 text-lg text-foreground-secondary">
                <p>
                  These Terms constitute the entire agreement between you and TPMJS regarding your
                  use of the Service and supersede any prior agreements or understandings, whether
                  written or oral.
                </p>
              </div>
            </section>
          </div>

          {/* Footer CTA */}
          <div className="mt-16 p-8 border border-border rounded-lg bg-surface text-center">
            <h2 className="text-2xl font-bold mb-4 text-foreground">
              Questions About These Terms?
            </h2>
            <p className="text-lg text-foreground-secondary mb-6">
              We&apos;re here to help. Reach out if you need clarification on anything.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="mailto:hello@tpmjs.com">
                <button
                  type="button"
                  className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
                >
                  Contact Us
                </button>
              </a>
              <Link href="/">
                <button
                  type="button"
                  className="px-6 py-3 border border-border rounded-lg font-medium hover:bg-surface transition-colors text-foreground"
                >
                  Back to Home
                </button>
              </Link>
            </div>
          </div>
        </Container>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <Container size="xl" padding="lg">
          <div className="text-center text-foreground-secondary">
            <p>
              © 2025 TPMJS. All rights reserved.{' '}
              <Link href="/terms" className="text-primary hover:underline">
                Terms of Service
              </Link>
            </p>
          </div>
        </Container>
      </footer>
    </div>
  );
}
