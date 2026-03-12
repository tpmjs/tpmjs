'use client';

import { Container } from '@tpmjs/ui/Container/Container';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import Link from 'next/link';

const productLinks = [
  { href: '/tool/tool-search', label: 'Browse Tools' },
  { href: '/collections', label: 'Collections' },
  { href: '/agents', label: 'Agents' },
  { href: '/publish', label: 'Publish a Tool' },
  { href: '/playground', label: 'Playground' },
];

const developerLinks = [
  { href: '/getting-started', label: 'Getting Started' },
  { href: '/docs', label: 'Documentation' },
  { href: '/docs/api', label: 'API Reference' },
  { href: '/sdk', label: 'SDK' },
  { href: '/spec', label: 'Specification' },
  { href: '/docs/executors', label: 'Custom Executors' },
];

const resourceLinks = [
  { href: '/how-it-works', label: 'How It Works' },
  { href: '/compare', label: 'Compare' },
  { href: '/faq', label: 'FAQ' },
  { href: '/blog', label: 'Blog' },
  { href: '/changelog', label: 'Changelog' },
  { href: '/about', label: 'About' },
];

export function AppFooter(): React.ReactElement {
  return (
    <footer className="border-t border-border bg-surface">
      <Container size="xl" padding="lg">
        {/* Main footer grid */}
        <div className="py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand column */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="text-xl font-bold uppercase tracking-tight text-foreground">
              TPMJS
            </Link>
            <p className="mt-3 text-sm text-foreground-secondary leading-relaxed">
              Open-source registry for AI agent tools. Auto-discovers from npm, serves via MCP.
            </p>
            <div className="mt-4 flex items-center gap-3">
              <a
                href="https://github.com/tpmjs/tpmjs"
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground-tertiary hover:text-foreground transition-colors"
                aria-label="GitHub"
              >
                <Icon icon="github" size="md" />
              </a>
              <a
                href="https://discord.gg/KuJRBCn89c"
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground-tertiary hover:text-foreground transition-colors"
                aria-label="Discord"
              >
                <Icon icon="discord" size="md" />
              </a>
              <a
                href="https://twitter.com/tpmjs_registry"
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground-tertiary hover:text-foreground transition-colors text-sm"
                aria-label="Twitter"
              >
                𝕏
              </a>
            </div>
          </div>

          {/* Product column */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground mb-3">
              Product
            </h3>
            <ul className="space-y-2">
              {productLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-foreground-secondary hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Developers column */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground mb-3">
              Developers
            </h3>
            <ul className="space-y-2">
              {developerLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-foreground-secondary hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources column */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground mb-3">
              Resources
            </h3>
            <ul className="space-y-2">
              {resourceLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-foreground-secondary hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="py-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-foreground-tertiary">
            &copy; {new Date().getFullYear()} TPMJS. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-xs">
            <a
              href="mailto:hello@tpmjs.com"
              className="text-foreground-tertiary hover:text-foreground transition-colors"
            >
              Contact
            </a>
            <span className="text-border">&middot;</span>
            <Link
              href="/privacy"
              className="text-foreground-tertiary hover:text-foreground transition-colors"
            >
              Privacy
            </Link>
            <span className="text-border">&middot;</span>
            <Link
              href="/terms"
              className="text-foreground-tertiary hover:text-foreground transition-colors"
            >
              Terms
            </Link>
          </div>
        </div>
      </Container>
    </footer>
  );
}
