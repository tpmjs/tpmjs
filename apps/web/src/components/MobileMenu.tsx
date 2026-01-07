'use client';

import { Button } from '@tpmjs/ui/Button/Button';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import Link from 'next/link';
import { useEffect } from 'react';
import { ThemeToggle } from './ThemeToggle';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  session: { user: { name: string; email: string } } | null;
}

interface NavSection {
  title: string;
  links: { href: string; label: string; description?: string; external?: boolean }[];
}

const navSections: NavSection[] = [
  {
    title: 'Explore',
    links: [
      { href: '/tool/tool-search', label: 'Tools', description: 'Browse all tools' },
      {
        href: 'https://playground.tpmjs.com',
        label: 'Playground',
        description: 'Try tools live',
        external: true,
      },
    ],
  },
  {
    title: 'Developers',
    links: [
      { href: '/docs', label: 'Documentation', description: 'Guides and tutorials' },
      { href: '/sdk', label: 'SDK', description: 'Build with our SDK' },
      { href: '/spec', label: 'Specification', description: 'TPMJS tool format' },
      { href: '/integrations', label: 'Integrations', description: 'Connect your tools' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { href: '/how-it-works', label: 'How It Works', description: 'Learn the basics' },
      { href: '/faq', label: 'FAQ', description: 'Common questions' },
      { href: '/changelog', label: 'Changelog', description: 'Latest updates' },
      { href: '/stats', label: 'Stats', description: 'Platform metrics' },
    ],
  },
];

const socialLinks = [
  { href: 'https://discord.gg/KuJRBCn89c', icon: 'discord' as const, label: 'Discord' },
  { href: 'https://github.com/tpmjs/tpmjs', icon: 'github' as const, label: 'GitHub' },
];

export function MobileMenu({
  isOpen,
  onClose,
  session,
}: MobileMenuProps): React.ReactElement | null {
  // Lock body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        onKeyDown={(e) => e.key === 'Escape' && onClose()}
        role="presentation"
      />

      {/* Slide-out drawer */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-72 bg-background border-l border-border shadow-xl transform transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation menu"
      >
        {/* Header with close button */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <span className="font-bold text-lg text-foreground">Menu</span>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close menu">
            <Icon icon="x" size="md" />
          </Button>
        </div>

        {/* Navigation sections */}
        <nav className="p-4 overflow-y-auto max-h-[calc(100vh-80px)]">
          {navSections.map((section, index) => (
            <div key={section.title}>
              <h3 className="px-3 py-2 text-xs font-semibold text-foreground-tertiary uppercase tracking-wider">
                {section.title}
              </h3>
              <ul className="space-y-1 mb-4">
                {section.links.map((link) => (
                  <li key={link.href}>
                    {link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between px-3 py-2.5 text-foreground hover:bg-surface rounded-md transition-colors"
                        onClick={onClose}
                      >
                        <div>
                          <div className="font-medium">{link.label}</div>
                          {link.description && (
                            <div className="text-xs text-foreground-tertiary">
                              {link.description}
                            </div>
                          )}
                        </div>
                        <Icon icon="externalLink" size="sm" className="text-foreground-tertiary" />
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="block px-3 py-2.5 text-foreground hover:bg-surface rounded-md transition-colors"
                        onClick={onClose}
                      >
                        <div className="font-medium">{link.label}</div>
                        {link.description && (
                          <div className="text-xs text-foreground-tertiary">{link.description}</div>
                        )}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
              {index < navSections.length - 1 && <div className="my-3 border-t border-border" />}
            </div>
          ))}

          {/* Divider before utilities */}
          <div className="my-4 border-t border-border" />

          {/* Social links and theme toggle */}
          <div className="flex items-center justify-between px-3 py-3">
            <div className="flex items-center gap-4">
              {socialLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground hover:text-foreground-secondary transition-colors"
                  onClick={onClose}
                  aria-label={link.label}
                >
                  <Icon icon={link.icon} size="md" />
                </a>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-foreground-secondary">Theme</span>
              <ThemeToggle />
            </div>
          </div>

          {/* Divider before auth */}
          <div className="my-4 border-t border-border" />

          {/* Auth Section - Segmented based on login status */}
          <h3 className="px-3 py-2 text-xs font-semibold text-foreground-tertiary uppercase tracking-wider">
            Account
          </h3>
          {session ? (
            <div className="space-y-1 mb-4">
              <Link
                href="/dashboard"
                className="block px-3 py-2.5 text-foreground hover:bg-surface rounded-md transition-colors"
                onClick={onClose}
              >
                <div className="font-medium">Dashboard</div>
                <div className="text-xs text-foreground-tertiary">Your overview</div>
              </Link>
              <Link
                href="/dashboard/agents"
                className="block px-3 py-2.5 text-foreground hover:bg-surface rounded-md transition-colors"
                onClick={onClose}
              >
                <div className="font-medium">My Agents</div>
                <div className="text-xs text-foreground-tertiary">Manage your agents</div>
              </Link>
              <Link
                href="/dashboard/collections"
                className="block px-3 py-2.5 text-foreground hover:bg-surface rounded-md transition-colors"
                onClick={onClose}
              >
                <div className="font-medium">Collections</div>
                <div className="text-xs text-foreground-tertiary">Organize your tools</div>
              </Link>
              <Link
                href="/dashboard/settings/api-keys"
                className="block px-3 py-2.5 text-foreground hover:bg-surface rounded-md transition-colors"
                onClick={onClose}
              >
                <div className="font-medium">API Keys</div>
                <div className="text-xs text-foreground-tertiary">Manage credentials</div>
              </Link>
            </div>
          ) : (
            <div className="space-y-2 mb-4 px-3">
              <Link href="/sign-in" onClick={onClose} className="block">
                <Button variant="outline" size="md" className="w-full">
                  Sign In
                </Button>
              </Link>
              <Link href="/sign-up" onClick={onClose} className="block">
                <Button variant="ghost" size="md" className="w-full">
                  Create Account
                </Button>
              </Link>
            </div>
          )}

          {/* Primary CTA */}
          <div className="px-3 mt-4">
            <Link href="/publish" onClick={onClose} className="block">
              <Button variant="default" size="lg" className="w-full">
                Publish Tool
              </Button>
            </Link>
          </div>
        </nav>
      </div>
    </>
  );
}
