'use client';

import { Button } from '@tpmjs/ui/Button/Button';
import { Header } from '@tpmjs/ui/Header/Header';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useSession } from '@/lib/auth-client';
import { MobileMenu } from './MobileMenu';
import { ThemeToggle } from './ThemeToggle';

interface DropdownItem {
  href: string;
  label: string;
  description?: string;
  external?: boolean;
}

interface NavDropdownProps {
  label: string;
  items: DropdownItem[];
}

function NavDropdown({ label, items }: NavDropdownProps): React.ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="ghost"
        size="sm"
        className="text-foreground hover:text-foreground flex items-center gap-1"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {label}
        <Icon
          icon="chevronDown"
          size="sm"
          className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </Button>
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-56 bg-background border border-border rounded-lg shadow-lg py-1 z-50">
          {items.map((item) =>
            item.external ? (
              <a
                key={item.href}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between px-4 py-2 text-sm text-foreground hover:bg-surface transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <div>
                  <div className="font-medium">{item.label}</div>
                  {item.description && (
                    <div className="text-xs text-foreground-tertiary">{item.description}</div>
                  )}
                </div>
                <Icon icon="externalLink" size="sm" className="text-foreground-tertiary" />
              </a>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                className="block px-4 py-2 text-sm text-foreground hover:bg-surface transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <div className="font-medium">{item.label}</div>
                {item.description && (
                  <div className="text-xs text-foreground-tertiary">{item.description}</div>
                )}
              </Link>
            )
          )}
        </div>
      )}
    </div>
  );
}

const developerItems: DropdownItem[] = [
  { href: '/docs', label: 'Documentation', description: 'Guides and tutorials' },
  { href: '/docs/api', label: 'API Reference', description: 'REST & MCP endpoints' },
  { href: '/docs/executors', label: 'Custom Executors', description: 'Deploy your own' },
  { href: '/sdk', label: 'SDK', description: 'Build with our SDK' },
  { href: '/spec', label: 'Specification', description: 'TPMJS tool format' },
  { href: '/integrations', label: 'Integrations', description: 'Connect your tools' },
];

const resourceItems: DropdownItem[] = [
  { href: '/how-it-works', label: 'How It Works', description: 'Learn the basics' },
  { href: '/faq', label: 'FAQ', description: 'Common questions' },
  { href: '/changelog', label: 'Changelog', description: 'Latest updates' },
  { href: '/stats', label: 'Stats', description: 'Platform metrics' },
];

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
            <div className="hidden lg:flex items-center gap-1">
              {/* Primary Links */}
              <Link href="/tool/tool-search">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-foreground hover:text-foreground font-semibold"
                >
                  Tools
                </Button>
              </Link>
              <Link href="/collections">
                <Button variant="ghost" size="sm" className="text-foreground hover:text-foreground">
                  Collections
                </Button>
              </Link>
              <Link href="/agents">
                <Button variant="ghost" size="sm" className="text-foreground hover:text-foreground">
                  Agents
                </Button>
              </Link>
              <a href="https://playground.tpmjs.com" target="_blank" rel="noopener noreferrer">
                <Button variant="ghost" size="sm" className="text-foreground hover:text-foreground">
                  Playground
                </Button>
              </a>

              {/* Separator */}
              <span className="text-foreground-tertiary mx-2">|</span>

              {/* Dropdown Menus */}
              <NavDropdown label="Developers" items={developerItems} />
              <NavDropdown label="Resources" items={resourceItems} />

              {/* Separator */}
              <span className="text-foreground-tertiary mx-2">|</span>

              {/* Social & Utilities */}
              <a
                href="https://discord.gg/KuJRBCn89c"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-foreground hover:text-foreground-secondary transition-colors"
                aria-label="Join our Discord"
              >
                <Icon icon="discord" size="md" />
              </a>
              <a
                href="https://github.com/tpmjs/tpmjs"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-foreground hover:text-foreground-secondary transition-colors"
                aria-label="View on GitHub"
              >
                <Icon icon="github" size="md" />
              </a>
              <ThemeToggle />

              {/* Auth Section - Segmented */}
              <span className="text-foreground-tertiary mx-2">|</span>
              {session ? (
                <>
                  <Link href="/dashboard">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-foreground hover:text-foreground"
                    >
                      Dashboard
                    </Button>
                  </Link>
                  <Link href="/dashboard/agents">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-foreground hover:text-foreground"
                    >
                      Agents
                    </Button>
                  </Link>
                </>
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

              {/* Primary CTA */}
              <Link href="/publish">
                <Button variant="default" size="sm">
                  Publish
                </Button>
              </Link>
            </div>

            {/* Mobile Hamburger Button - shown on mobile/tablet */}
            <Button
              variant="ghost"
              size="sm"
              className="flex lg:hidden text-foreground"
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
