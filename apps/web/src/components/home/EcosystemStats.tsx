'use client';

import { Container } from '@tpmjs/ui/Container/Container';
import { DitherSectionHeader } from '@tpmjs/ui/DitherText/DitherSectionHeader';
import { StatCard } from '@tpmjs/ui/StatCard/StatCard';
import { PublicActivityStream } from './PublicActivityStream';

interface EcosystemStatsProps {
  stats: {
    publishedTools: number;
    activeDevelopers: number;
    totalExecutions: number;
    avgResponseMs: number | null;
    totalDownloads: number;
  };
}

export function EcosystemStats({ stats }: EcosystemStatsProps): React.ReactElement {
  const statistics = [
    {
      value: stats.publishedTools,
      label: 'Published Tools',
      subtext: 'Auto-synced from npm',
      suffix: '',
    },
    {
      value: stats.activeDevelopers,
      label: 'Active Developers',
      subtext: 'Last 7 days',
      suffix: '',
    },
    {
      value: stats.totalExecutions,
      label: 'Total Executions',
      subtext: 'All-time tool calls',
      suffix: '',
    },
    {
      value: stats.avgResponseMs ? Math.round(stats.avgResponseMs / 100) / 10 : 0,
      label: 'Avg Response',
      subtext: 'Execution latency',
      suffix: 's',
      decimals: 1,
    },
  ];

  return (
    <section className="py-16 md:py-24 bg-surface relative overflow-hidden">
      {/* Subtle grid background */}
      <div className="absolute inset-0 opacity-[0.02] grid-background" />

      <Container size="xl" padding="lg" className="relative z-10">
        <DitherSectionHeader className="mb-12 text-center">LIVE ECOSYSTEM</DitherSectionHeader>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {statistics.map((stat, index) => (
            <div
              key={stat.label}
              className={`opacity-0 animate-brutalist-entrance stagger-${index + 1}`}
            >
              <StatCard
                value={stat.value}
                label={stat.label}
                subtext={stat.subtext}
                suffix={stat.suffix}
                decimals={stat.decimals}
                variant="brutalist"
                size="md"
                showBar={true}
                barProgress={60 + index * 10}
              />
            </div>
          ))}
        </div>

        {/* Activity Stream */}
        <div className="max-w-3xl mx-auto">
          <PublicActivityStream />
        </div>
      </Container>
    </section>
  );
}
