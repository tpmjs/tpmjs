'use client';

import { useSession } from '@/lib/auth-client';
import { Button } from '@tpmjs/ui/Button/Button';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import Link from 'next/link';
import { DashboardActivityStream } from '~/components/DashboardActivityStream';
import { DashboardLayout } from '~/components/dashboard/DashboardLayout';

export default function DashboardPage(): React.ReactElement {
  const { data: session } = useSession();

  return (
    <DashboardLayout title="Overview">
      {/* Welcome Banner */}
      <div className="mb-8 p-6 rounded-lg bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20">
        <h2 className="text-xl font-semibold text-foreground mb-2">
          Welcome back{session?.user?.name ? `, ${session.user.name.split(' ')[0]}` : ''}!
        </h2>
        <p className="text-foreground-secondary mb-4">
          Build AI agents, organize tools into collections, and connect them to your workflows.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href="/dashboard/agents/new">
            <Button size="sm">
              <Icon icon="plus" size="xs" className="mr-1" />
              Create Agent
            </Button>
          </Link>
          <Link href="/tool/tool-search">
            <Button size="sm" variant="outline">
              <Icon icon="search" size="xs" className="mr-1" />
              Browse Tools
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <Link href="/dashboard/agents" className="block group">
          <div className="bg-surface border border-border rounded-lg p-6 hover:border-primary/50 hover:shadow-md transition-all h-full">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Icon icon="terminal" size="md" className="text-primary" />
              </div>
              <Icon
                icon="chevronRight"
                size="sm"
                className="text-foreground-tertiary group-hover:text-primary group-hover:translate-x-1 transition-all"
              />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-1">Agents</h3>
            <p className="text-sm text-foreground-secondary">
              Create AI agents with custom tools and system prompts
            </p>
          </div>
        </Link>

        <Link href="/dashboard/collections" className="block group">
          <div className="bg-surface border border-border rounded-lg p-6 hover:border-primary/50 hover:shadow-md transition-all h-full">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Icon icon="folder" size="md" className="text-primary" />
              </div>
              <Icon
                icon="chevronRight"
                size="sm"
                className="text-foreground-tertiary group-hover:text-primary group-hover:translate-x-1 transition-all"
              />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-1">Collections</h3>
            <p className="text-sm text-foreground-secondary">
              Group tools together and share them as MCP servers
            </p>
          </div>
        </Link>

        <Link href="/dashboard/settings/tpmjs-api-keys" className="block group">
          <div className="bg-surface border border-border rounded-lg p-6 hover:border-primary/50 hover:shadow-md transition-all h-full">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Icon icon="key" size="md" className="text-primary" />
              </div>
              <Icon
                icon="chevronRight"
                size="sm"
                className="text-foreground-tertiary group-hover:text-primary group-hover:translate-x-1 transition-all"
              />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-1">Platform API Keys</h3>
            <p className="text-sm text-foreground-secondary">
              Generate keys to access TPMJS from scripts and CI/CD
            </p>
          </div>
        </Link>
      </div>

      {/* Two-column layout for Profile and Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Profile Section */}
        <div className="bg-surface border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-foreground">Profile</h2>
            <Link href="/dashboard/settings/profile">
              <Button size="sm" variant="ghost">
                <Icon icon="edit" size="xs" className="mr-1" />
                Edit
              </Button>
            </Link>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-2xl font-bold text-primary">
                  {session?.user?.name?.[0]?.toUpperCase() || 'U'}
                </span>
              </div>
              <div>
                <p className="text-lg font-medium text-foreground">
                  {session?.user?.name || 'User'}
                </p>
                <p className="text-sm text-foreground-secondary">{session?.user?.email}</p>
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <div className="flex items-center gap-2 text-sm">
                <Icon
                  icon={session?.user?.emailVerified ? 'check' : 'alertCircle'}
                  size="xs"
                  className={session?.user?.emailVerified ? 'text-success' : 'text-warning'}
                />
                <span className="text-foreground-secondary">
                  {session?.user?.emailVerified ? 'Email verified' : 'Email not verified'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Activity Stream Section */}
        <div className="bg-surface border border-border rounded-lg p-6">
          <h2 className="text-lg font-medium text-foreground mb-4">Recent Activity</h2>
          <DashboardActivityStream autoRefreshInterval={30000} />
        </div>
      </div>
    </DashboardLayout>
  );
}
