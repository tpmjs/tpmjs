import { AppHeader } from '@/components/AppHeader';
import { SignOutButton } from '@/components/auth/SignOutButton';
import { auth } from '@/lib/auth';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import { headers } from 'next/headers';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect('/sign-in');
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="max-w-4xl mx-auto py-12 px-4">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <SignOutButton />
        </div>

        {/* Quick Actions */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
          <Link href="/dashboard/agents" className="block">
            <div className="bg-background border border-border rounded-lg p-6 hover:border-foreground/20 transition-colors group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Icon icon="terminal" size="md" className="text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-medium text-foreground">My Agents</h2>
                  <p className="text-sm text-foreground-secondary">
                    Create and manage AI agents with tools
                  </p>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/dashboard/collections" className="block">
            <div className="bg-background border border-border rounded-lg p-6 hover:border-foreground/20 transition-colors group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Icon icon="folder" size="md" className="text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-medium text-foreground">My Collections</h2>
                  <p className="text-sm text-foreground-secondary">
                    Organize and share your favorite tools
                  </p>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/dashboard/settings/api-keys" className="block">
            <div className="bg-background border border-border rounded-lg p-6 hover:border-foreground/20 transition-colors group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Icon icon="key" size="md" className="text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-medium text-foreground">API Keys</h2>
                  <p className="text-sm text-foreground-secondary">
                    Manage AI provider credentials
                  </p>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Profile Section */}
        <div className="bg-background border border-border rounded-lg p-6">
          <h2 className="text-lg font-medium text-foreground mb-4">Profile</h2>

          <div className="space-y-4">
            <div>
              <span className="block text-sm text-foreground-secondary">Name</span>
              <p className="text-foreground font-medium">{session.user.name}</p>
            </div>

            <div>
              <span className="block text-sm text-foreground-secondary">Email</span>
              <p className="text-foreground font-medium">{session.user.email}</p>
            </div>

            <div>
              <span className="block text-sm text-foreground-secondary">Email Verified</span>
              <p className="text-foreground font-medium">
                {session.user.emailVerified ? (
                  <span className="text-green-600">Verified</span>
                ) : (
                  <span className="text-amber-600">Not verified</span>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
