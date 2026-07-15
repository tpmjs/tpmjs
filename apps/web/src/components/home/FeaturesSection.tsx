'use client';

import { Badge } from '@tpmjs/ui/Badge/Badge';
import { Button } from '@tpmjs/ui/Button/Button';
import { Container } from '@tpmjs/ui/Container/Container';
import type { IconName } from '@tpmjs/ui/Icon/Icon';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import Link from 'next/link';

// ============================================================================
// Feature Card Component
// ============================================================================

interface FeatureCardProps {
  icon: IconName;
  title: string;
  description: string;
  badge?: string;
  href?: string;
}

function FeatureCard({
  icon,
  title,
  description,
  badge,
  href,
}: FeatureCardProps): React.ReactElement {
  const content = (
    <div className="group h-full p-6 border border-dashed border-border bg-surface hover:border-primary hover:bg-primary/5 transition-all duration-200">
      {/* Icon */}
      <div className="w-12 h-12 flex items-center justify-center mb-4 border border-dashed border-border bg-background group-hover:border-primary group-hover:bg-primary/10 transition-all duration-200">
        <Icon
          icon={icon}
          size="md"
          className="text-foreground-secondary group-hover:text-primary transition-colors duration-200"
        />
      </div>

      {/* Content */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-mono text-lg font-semibold text-foreground lowercase group-hover:text-primary transition-colors">
          {title}
        </h3>
        {badge && (
          <Badge variant="outline" size="sm" className="flex-shrink-0">
            {badge}
          </Badge>
        )}
      </div>
      <p className="font-sans text-sm text-foreground-secondary leading-relaxed">{description}</p>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    );
  }

  return content;
}

// ============================================================================
// Main Features Section
// ============================================================================

interface FeaturesSectionProps {
  toolCount?: number;
}

export function FeaturesSection({ toolCount }: FeaturesSectionProps): React.ReactElement {
  const toolCountLabel = toolCount && toolCount > 0 ? `${toolCount.toLocaleString()}` : '100+';

  const features: Array<{
    icon: IconName;
    title: string;
    description: string;
    badge: string;
    href?: string;
  }> = [
    {
      icon: 'key',
      title: 'sandboxed execution',
      description:
        'Every tool runs in an isolated hosted Deno sandbox with timeouts and rate limits — you never install an untrusted MCP server or run its code on your own machine. Credentials encrypted at rest.',
      badge: 'sandboxed',
    },
    {
      icon: 'checkCircle',
      title: 'quality + health scores',
      description:
        'Every tool is auto-scored on docs, usage, and liveness, and continuously health-checked — the runtime verification bare registries skip. Dead tools do not look like live ones here.',
      badge: 'continuous',
      href: '/scenarios',
    },
    {
      icon: 'link',
      title: 'collections = one mcp url',
      description:
        'Curate a set of tools and expose it to Claude Code, Cursor, ChatGPT, or any MCP client through a single URL. On-demand discovery instead of tens of thousands of tokens of tool schemas up front.',
      badge: 'universal',
      href: '/integrations',
    },
    {
      icon: 'terminal',
      title: 'npm-native publishing',
      description:
        'Already shipping to npm? Add one keyword. No server to host, no OAuth, no uptime to run. Zod schemas auto-extracted, AI SDK format, TypeScript-first — live within minutes.',
      badge: 'npm',
      href: '/publish',
    },
    {
      icon: 'search',
      title: 'tool registry',
      description: `${toolCountLabel} AI tools from npm, auto-discovered within minutes of publication and indexed for search across dozens of categories.`,
      badge: 'auto-sync',
      href: '/tool/tool-search',
    },
    {
      icon: 'puzzle',
      title: 'omega agent',
      description:
        'An AI agent that discovers and runs tools on the fly based on what you ask. Zero config.',
      badge: 'live',
      href: '/omega',
    },
    {
      icon: 'user',
      title: 'custom agents',
      description:
        'Build agents with any LLM, custom prompts, and curated tool sets. Share publicly or keep private.',
      badge: 'unlimited',
      href: '/agents',
    },
    {
      icon: 'message',
      title: 'living skills',
      description:
        'Documentation that evolves from real usage. Skills surface from question patterns and proven tool combinations.',
      badge: 'new',
      href: '/docs/skills',
    },
    {
      icon: 'folder',
      title: 'test scenarios',
      description:
        'Auto-generated test scenarios validate tool behavior. Track pass rates, latency, and quality scores over time.',
      badge: 'automated',
      href: '/scenarios',
    },
  ];

  return (
    <section className="py-20 bg-background border-t border-border">
      <Container size="xl" padding="lg">
        {/* Section Header */}
        <div className="text-center mb-16">
          <p className="font-mono text-xs text-primary uppercase tracking-widest mb-3">
            what you get
          </p>
          <h2 className="font-mono text-3xl md:text-4xl font-semibold mb-4 text-foreground lowercase">
            the layer on top of the registry
          </h2>
          <p className="text-base text-foreground-secondary max-w-2xl mx-auto font-sans">
            The official MCP registry points at packages. tpmjs is the curated, health-scored,
            sandboxed execution layer on top of it — discovery, quality scoring, isolated runtime,
            MCP endpoints, collections, agents, and an SDK. All open source.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
          {features.map((feature) => (
            <FeatureCard
              key={feature.title}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              badge={feature.badge}
              href={feature.href}
            />
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <div className="inline-flex flex-col sm:flex-row gap-4">
            <Link href="/omega">
              <Button size="lg" variant="default">
                Try Omega Agent
              </Button>
            </Link>
            <Link href="/docs">
              <Button size="lg" variant="outline">
                Read the Docs
              </Button>
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
