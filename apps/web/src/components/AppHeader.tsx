'use client';

import { Button } from '@tpmjs/ui/Button/Button';
import { Header } from '@tpmjs/ui/Header/Header';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import Link from 'next/link';

/**
 * Shared application header used across all pages
 */
export function AppHeader(): React.ReactElement {
  return (
    <Header
      title={
        <Link
          href="/"
          className="text-foreground hover:text-foreground text-xl md:text-2xl font-bold uppercase tracking-tight"
        >
          TPMJS
        </Link>
      }
      size="md"
      sticky={true}
      actions={
        <div className="flex items-center gap-4">
          <Link href="/tool/tool-search">
            <Button variant="ghost" size="sm" className="text-foreground hover:text-foreground">
              Tools
            </Button>
          </Link>
          <Link href="/how-it-works">
            <Button variant="ghost" size="sm" className="text-foreground hover:text-foreground">
              How It Works
            </Button>
          </Link>
          <Link href="/playground">
            <Button variant="ghost" size="sm" className="text-foreground hover:text-foreground">
              Playground
            </Button>
          </Link>
          <Link href="/spec">
            <Button variant="ghost" size="sm" className="text-foreground hover:text-foreground">
              Spec
            </Button>
          </Link>
          <a
            href="https://github.com/tpmjs/tpmjs"
            target="_blank"
            rel="noopener noreferrer"
            className="text-foreground hover:text-foreground transition-colors"
          >
            <Icon icon="github" size="md" />
          </a>
          <Link href="/publish">
            <Button variant="default" size="sm">
              Publish Tool
            </Button>
          </Link>
        </div>
      }
    />
  );
}
