'use client';

import { Container } from '@tpmjs/ui/Container/Container';
import Link from 'next/link';

export function AppFooter(): React.ReactElement {
  return (
    <footer className="py-8 border-t border-border bg-surface">
      <Container size="xl" padding="lg">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-foreground-secondary">© 2025 TPMJS. All rights reserved.</p>
          <div className="flex items-center gap-4 text-sm">
            <a
              href="mailto:hello@tpmjs.com"
              className="text-foreground-secondary hover:text-foreground transition-colors"
            >
              Contact
            </a>
            <span className="text-border">·</span>
            <Link
              href="/privacy"
              className="text-foreground-secondary hover:text-foreground transition-colors"
            >
              Privacy
            </Link>
            <span className="text-border">·</span>
            <Link
              href="/terms"
              className="text-foreground-secondary hover:text-foreground transition-colors"
            >
              Terms
            </Link>
            <span className="text-border">·</span>
            <a
              href="https://github.com/tpmjs/tpmjs"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground-secondary hover:text-foreground transition-colors"
            >
              GitHub
            </a>
            <span className="text-border">·</span>
            <a
              href="https://twitter.com/tpmjs_registry"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground-secondary hover:text-foreground transition-colors"
            >
              Twitter
            </a>
          </div>
        </div>
      </Container>
    </footer>
  );
}
