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
          <Link href="/docs">
            <Button variant="ghost" size="sm" className="text-foreground hover:text-foreground">
              Docs
            </Button>
          </Link>
          <Link href="/how-it-works">
            <Button variant="ghost" size="sm" className="text-foreground hover:text-foreground">
              How It Works
            </Button>
          </Link>
          <a href="https://playground.tpmjs.com" target="_blank" rel="noopener noreferrer">
            <Button variant="ghost" size="sm" className="text-foreground hover:text-foreground">
              Playground
            </Button>
          </a>
          <Link href="/spec">
            <Button variant="ghost" size="sm" className="text-foreground hover:text-foreground">
              Spec
            </Button>
          </Link>
          <Link href="/sdk">
            <Button variant="ghost" size="sm" className="text-foreground hover:text-foreground">
              SDK
            </Button>
          </Link>
          <Link href="/faq">
            <Button variant="ghost" size="sm" className="text-foreground hover:text-foreground">
              FAQ
            </Button>
          </Link>
          <Link href="/changelog">
            <Button variant="ghost" size="sm" className="text-foreground hover:text-foreground">
              Changelog
            </Button>
          </Link>
          <a
            href="https://discord.gg/KuJRBCn89c"
            target="_blank"
            rel="noopener noreferrer"
            className="text-foreground hover:text-foreground transition-colors"
          >
            <Icon icon="discord" size="md" />
          </a>
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
