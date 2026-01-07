'use client';

import { useSession } from '@/lib/auth-client';
import { Button } from '@tpmjs/ui/Button/Button';
import { Icon, type IconName } from '@tpmjs/ui/Icon/Icon';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AppHeader } from '../AppHeader';

interface NavItem {
  href: string;
  label: string;
  icon: IconName;
  badge?: number;
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Overview', icon: 'home' },
  { href: '/dashboard/agents', label: 'Agents', icon: 'terminal' },
  { href: '/dashboard/collections', label: 'Collections', icon: 'folder' },
  { href: '/dashboard/settings/api-keys', label: 'API Keys', icon: 'key' },
];

interface DashboardLayoutProps {
  children: React.ReactNode;
  /** Title displayed in the header */
  title: string;
  /** Optional subtitle/description */
  subtitle?: string;
  /** Action buttons for the header */
  actions?: React.ReactNode;
  /** Whether to show back button */
  showBackButton?: boolean;
  /** Custom back URL (defaults to parent route) */
  backUrl?: string;
}

export function DashboardLayout({
  children,
  title,
  subtitle,
  actions,
  showBackButton,
  backUrl,
}: DashboardLayoutProps): React.ReactElement {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (!isPending && !session) {
      router.push('/sign-in');
    }
  }, [isPending, session, router]);

  // Close sidebar on route change - pathname dependency triggers this effect
  // biome-ignore lint/correctness/useExhaustiveDependencies: pathname triggers effect
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  const getBackUrl = () => {
    if (backUrl) return backUrl;
    // Get parent route
    const parts = pathname.split('/').filter(Boolean);
    parts.pop();
    return parts.length > 0 ? `/${parts.join('/')}` : '/dashboard';
  };

  if (isPending) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <div className="animate-pulse text-foreground-secondary">Loading...</div>
        </div>
      </div>
    );
  }

  if (!session) {
    return <div />;
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <div className="flex">
        {/* Mobile sidebar backdrop */}
        {sidebarOpen && (
          <button
            type="button"
            className="fixed inset-0 bg-black/50 z-40 lg:hidden cursor-default"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          />
        )}

        {/* Sidebar */}
        <aside
          className={`
            fixed lg:sticky top-16 left-0 z-50 lg:z-0
            w-64 h-[calc(100vh-64px)] bg-background border-r border-border
            transform transition-transform lg:transform-none
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          `}
        >
          <nav className="p-4 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                  ${
                    isActive(item.href)
                      ? 'bg-primary/10 text-primary'
                      : 'text-foreground-secondary hover:text-foreground hover:bg-surface'
                  }
                `}
              >
                <Icon icon={item.icon} size="sm" />
                <span>{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="ml-auto text-xs bg-surface-secondary px-1.5 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}
          </nav>

          {/* User section at bottom */}
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Icon icon="user" size="sm" className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {session.user?.name || 'User'}
                </p>
                <p className="text-xs text-foreground-tertiary truncate">{session.user?.email}</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0">
          {/* Content header */}
          <div className="sticky top-16 z-10 bg-background border-b border-border">
            <div className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {/* Mobile menu button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="lg:hidden"
                    onClick={() => setSidebarOpen(true)}
                  >
                    <Icon icon="menu" size="sm" />
                  </Button>

                  {/* Back button */}
                  {showBackButton && (
                    <Link
                      href={getBackUrl()}
                      className="text-foreground-secondary hover:text-foreground transition-colors"
                    >
                      <Icon icon="arrowLeft" size="sm" />
                    </Link>
                  )}

                  {/* Title */}
                  <div>
                    <h1 className="text-xl font-semibold text-foreground">{title}</h1>
                    {subtitle && <p className="text-sm text-foreground-secondary">{subtitle}</p>}
                  </div>
                </div>

                {/* Actions */}
                {actions && <div className="flex items-center gap-2">{actions}</div>}
              </div>
            </div>
          </div>

          {/* Page content */}
          <div className="p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
