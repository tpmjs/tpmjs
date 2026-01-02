'use client';

import { Button } from '@tpmjs/ui/Button/Button';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import Link from 'next/link';
import { useEffect } from 'react';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  session: { user: { name: string; email: string } } | null;
}

const navLinks = [
  { href: '/tool/tool-search', label: 'Tools' },
  { href: '/dashboard/agents', label: 'Agents' },
  { href: '/docs', label: 'Docs' },
  { href: '/how-it-works', label: 'How It Works' },
  { href: '/integrations', label: 'Integrations' },
  { href: 'https://playground.tpmjs.com', label: 'Playground', external: true },
  { href: '/spec', label: 'Spec' },
  { href: '/sdk', label: 'SDK' },
  { href: '/faq', label: 'FAQ' },
  { href: '/stats', label: 'Stats' },
  { href: '/changelog', label: 'Changelog' },
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

        {/* Navigation links */}
        <nav className="p-4">
          <ul className="space-y-1">
            {navLinks.map((link) => (
              <li key={link.href}>
                {link.external ? (
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-3 text-foreground hover:bg-surface rounded-md transition-colors"
                    onClick={onClose}
                  >
                    {link.label}
                    <Icon icon="externalLink" size="sm" className="text-foreground-tertiary" />
                  </a>
                ) : (
                  <Link
                    href={link.href}
                    className="block px-3 py-3 text-foreground hover:bg-surface rounded-md transition-colors"
                    onClick={onClose}
                  >
                    {link.label}
                  </Link>
                )}
              </li>
            ))}
          </ul>

          {/* Divider */}
          <div className="my-4 border-t border-border" />

          {/* Social links */}
          <ul className="space-y-1">
            {socialLinks.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-3 py-3 text-foreground hover:bg-surface rounded-md transition-colors"
                  onClick={onClose}
                >
                  <Icon icon={link.icon} size="md" />
                  {link.label}
                </a>
              </li>
            ))}
          </ul>

          {/* Divider */}
          <div className="my-4 border-t border-border" />

          {/* Auth links */}
          {session ? (
            <Link
              href="/dashboard"
              className="block px-3 py-3 text-foreground hover:bg-surface rounded-md transition-colors mb-4"
              onClick={onClose}
            >
              Dashboard
            </Link>
          ) : (
            <div className="space-y-1 mb-4">
              <Link
                href="/sign-in"
                className="block px-3 py-3 text-foreground hover:bg-surface rounded-md transition-colors"
                onClick={onClose}
              >
                Sign In
              </Link>
              <Link
                href="/sign-up"
                className="block px-3 py-3 text-foreground hover:bg-surface rounded-md transition-colors"
                onClick={onClose}
              >
                Sign Up
              </Link>
            </div>
          )}

          {/* Publish button */}
          <Link href="/publish" onClick={onClose}>
            <Button variant="default" size="lg" className="w-full">
              Publish Tool
            </Button>
          </Link>
        </nav>
      </div>
    </>
  );
}
