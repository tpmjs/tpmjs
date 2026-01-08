'use client';

import { Icon } from '@tpmjs/ui/Icon/Icon';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { DashboardLayout } from '~/components/dashboard/DashboardLayout';

interface LikeCounts {
  tools: number;
  collections: number;
  agents: number;
  toolsHasMore: boolean;
  collectionsHasMore: boolean;
  agentsHasMore: boolean;
}

export default function LikesOverviewPage(): React.ReactElement {
  const [counts, setCounts] = useState<LikeCounts>({
    tools: 0,
    collections: 0,
    agents: 0,
    toolsHasMore: false,
    collectionsHasMore: false,
    agentsHasMore: false,
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchCounts = useCallback(async () => {
    try {
      const [toolsRes, collectionsRes, agentsRes] = await Promise.all([
        fetch('/api/user/likes/tools?limit=1'),
        fetch('/api/user/likes/collections?limit=1'),
        fetch('/api/user/likes/agents?limit=1'),
      ]);

      const [toolsData, collectionsData, agentsData] = await Promise.all([
        toolsRes.json(),
        collectionsRes.json(),
        agentsRes.json(),
      ]);

      // Get counts from the data arrays
      // Note: This is a rough count, ideally we'd have a count endpoint
      setCounts({
        tools: toolsData.success ? toolsData.data.length : 0,
        collections: collectionsData.success ? collectionsData.data.length : 0,
        agents: agentsData.success ? agentsData.data.length : 0,
        toolsHasMore: toolsData.success ? toolsData.pagination.hasMore : false,
        collectionsHasMore: collectionsData.success ? collectionsData.pagination.hasMore : false,
        agentsHasMore: agentsData.success ? agentsData.pagination.hasMore : false,
      });
    } catch (err) {
      console.error('Failed to fetch like counts:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCounts();
  }, [fetchCounts]);

  const sections = [
    {
      href: '/dashboard/likes/tools',
      title: 'Liked Tools',
      description: "Tools you've saved for quick access",
      icon: 'puzzle' as const,
      count: counts.tools,
      hasMore: counts.toolsHasMore,
    },
    {
      href: '/dashboard/likes/collections',
      title: 'Liked Collections',
      description: "Curated tool collections you've bookmarked",
      icon: 'folder' as const,
      count: counts.collections,
      hasMore: counts.collectionsHasMore,
    },
    {
      href: '/dashboard/likes/agents',
      title: 'Liked Agents',
      description: "AI agents you've found useful",
      icon: 'terminal' as const,
      count: counts.agents,
      hasMore: counts.agentsHasMore,
    },
  ];

  return (
    <DashboardLayout
      title="Your Likes"
      subtitle="Manage your favorite tools, collections, and agents"
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sections.map((section) => (
          <Link key={section.href} href={section.href} className="block">
            <div className="bg-white border border-border rounded-lg p-6 hover:border-foreground/20 hover:shadow-sm transition-all group h-full">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Icon icon={section.icon} size="md" className="text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-medium text-foreground">{section.title}</h2>
                    {!isLoading && (
                      <span className="text-sm text-foreground-tertiary">
                        ({section.count}
                        {section.hasMore ? '+' : ''})
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-foreground-secondary">{section.description}</p>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-8 p-6 bg-surface/50 border border-border rounded-lg">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Icon icon="heart" size="sm" className="text-primary" />
          </div>
          <div>
            <h3 className="font-medium text-foreground mb-1">How likes work</h3>
            <p className="text-sm text-foreground-secondary">
              Click the heart icon on any tool, collection, or agent to save it to your likes. Your
              liked items appear here for quick access. Likes also help others discover popular
              content on the platform.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
