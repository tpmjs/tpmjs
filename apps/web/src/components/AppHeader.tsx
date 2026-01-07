'use client';

import { useSession } from '@/lib/auth-client';
import { Button } from '@tpmjs/ui/Button/Button';
import { Header } from '@tpmjs/ui/Header/Header';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import Link from 'next/link';
import { useState } from 'react';
import { MobileMenu } from './MobileMenu';

/**
 * Shared application header used across all pages
 */
export function AppHeader(): React.ReactElement {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { data: session } = useSession();

  return (
    <>
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
          <>
            {/* Desktop Navigation - hidden on mobile */}
            <div className="hidden md:flex items-center gap-4">
              {/* Core Product Links */}
              <Link href="/tool/tool-search">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-foreground hover:text-foreground font-semibold"
                >
                  Tools
                </Button>
              </Link>
              <Link href="/dashboard/agents">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-foreground hover:text-foreground font-semibold"
                >
                  Agents
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
              <Link href="/integrations">
                <Button variant="ghost" size="sm" className="text-foreground hover:text-foreground">
                  Integrations
                </Button>
              </Link>

              {/* Separator */}
              <span className="text-foreground-tertiary">|</span>

              {/* Developer Section */}
              <Link href="/docs">
                <Button variant="ghost" size="sm" className="text-foreground hover:text-foreground">
                  Docs
                </Button>
              </Link>
              <Link href="/sdk">
                <Button variant="ghost" size="sm" className="text-foreground hover:text-foreground">
                  SDK
                </Button>
              </Link>
              <Link href="/spec">
                <Button variant="ghost" size="sm" className="text-foreground hover:text-foreground">
                  Spec
                </Button>
              </Link>
              <Link href="/changelog">
                <Button variant="ghost" size="sm" className="text-foreground hover:text-foreground">
                  Changelog
                </Button>
              </Link>
              <Link href="/faq">
                <Button variant="ghost" size="sm" className="text-foreground hover:text-foreground">
                  FAQ
                </Button>
              </Link>
              <Link href="/stats">
                <Button variant="ghost" size="sm" className="text-foreground hover:text-foreground">
                  Stats
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
              {session ? (
                <Link href="/dashboard">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-foreground hover:text-foreground"
                  >
                    Dashboard
                  </Button>
                </Link>
              ) : (
                <Link href="/sign-in">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-foreground hover:text-foreground"
                  >
                    Sign In
                  </Button>
                </Link>
              )}
              <Link href="/publish">
                <Button variant="default" size="sm">
                  Publish Tool
                </Button>
              </Link>
            </div>

            {/* Mobile Hamburger Button - shown on mobile only */}
            <Button
              variant="ghost"
              size="sm"
              className="flex md:hidden text-foreground"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open menu"
            >
              <Icon icon="menu" size="md" />
            </Button>
          </>
        }
      />

      {/* Mobile Menu Drawer */}
      <MobileMenu
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        session={session}
      />
    </>
  );
}
