'use client';

import { useSession } from '@/lib/auth-client';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import Link from 'next/link';
import { DashboardActivityStream } from '~/components/DashboardActivityStream';
import { DashboardLayout } from '~/components/dashboard/DashboardLayout';

export default function DashboardPage(): React.ReactElement {
  const { data: session } = useSession();

  return (
    <DashboardLayout title="Overview">
      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <Link href="/dashboard/agents" className="block">
          <div className="bg-white border border-border rounded-lg p-6 hover:border-foreground/20 hover:shadow-sm transition-all group">
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
          <div className="bg-white border border-border rounded-lg p-6 hover:border-foreground/20 hover:shadow-sm transition-all group">
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
          <div className="bg-white border border-border rounded-lg p-6 hover:border-foreground/20 hover:shadow-sm transition-all group">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Icon icon="key" size="md" className="text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-medium text-foreground">API Keys</h2>
                <p className="text-sm text-foreground-secondary">Manage AI provider credentials</p>
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Two-column layout for Profile and Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Profile Section */}
        <div className="bg-white border border-border rounded-lg p-6">
          <h2 className="text-lg font-medium text-foreground mb-4">Profile</h2>

          <div className="space-y-4">
            <div>
              <span className="block text-sm text-foreground-secondary">Name</span>
              <p className="text-foreground font-medium">{session?.user?.name || 'User'}</p>
            </div>

            <div>
              <span className="block text-sm text-foreground-secondary">Email</span>
              <p className="text-foreground font-medium">{session?.user?.email}</p>
            </div>

            <div>
              <span className="block text-sm text-foreground-secondary">Email Verified</span>
              <p className="text-foreground font-medium">
                {session?.user?.emailVerified ? (
                  <span className="text-success">Verified</span>
                ) : (
                  <span className="text-warning">Not verified</span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Activity Stream Section */}
        <div className="bg-white border border-border rounded-lg p-6">
          <h2 className="text-lg font-medium text-foreground mb-4">Recent Activity</h2>
          <DashboardActivityStream autoRefreshInterval={30000} />
        </div>
      </div>
    </DashboardLayout>
  );
}
