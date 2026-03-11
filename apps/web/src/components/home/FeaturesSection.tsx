'use client';

import { Badge } from '@tpmjs/ui/Badge/Badge';
import { Button } from '@tpmjs/ui/Button/Button';
import { Container } from '@tpmjs/ui/Container/Container';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import Link from 'next/link';

// ============================================================================
// Feature Card Component
// ============================================================================

interface FeatureCardProps {
  icon: string;
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
          icon={icon as any}
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

  const features = [
    {
      icon: 'search',
      title: 'tool registry',
      description: `${toolCountLabel} AI tools from npm, auto-discovered within minutes of publication. Quality scored and health monitored.`,
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
      icon: 'folder',
      title: 'collections',
      description:
        'Group tools into workflow bundles. Add test scenarios to validate behavior and auto-generate usage docs.',
      badge: 'shareable',
      href: '/collections',
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
      icon: 'link',
      title: 'mcp protocol',
      description:
        'One URL gives Claude Desktop, Cursor, Windsurf, or any MCP client instant access to your tools.',
      badge: 'universal',
      href: '/integrations',
    },
    {
      icon: 'key',
      title: 'secure execution',
      description:
        'Tools run in isolated sandboxes with rate limiting and timeouts. Credentials encrypted at rest.',
      badge: 'sandboxed',
    },
    {
      icon: 'checkCircle',
      title: 'test scenarios',
      description:
        'Auto-generated test scenarios validate tool behavior. Track pass rates, latency, and quality scores.',
      badge: 'automated',
      href: '/scenarios',
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
      icon: 'terminal',
      title: 'developer sdk',
      description:
        'One npm keyword to publish. Zod schemas auto-extracted, Vercel AI SDK format, TypeScript-first.',
      badge: 'npm',
      href: '/publish',
    },
  ];

  return (
    <section className="py-20 bg-background border-t border-border">
      <Container size="xl" padding="lg">
        {/* Section Header */}
        <div className="text-center mb-16">
          <p className="font-mono text-xs text-primary uppercase tracking-widest mb-3">
            infrastructure layer
          </p>
          <h2 className="font-mono text-3xl md:text-4xl font-semibold mb-4 text-foreground lowercase">
            the agentic ecosystem
          </h2>
          <p className="text-base text-foreground-secondary max-w-2xl mx-auto font-sans">
            Everything your AI agents need to find, validate, and run tools — from auto-discovery to
            sandboxed execution.
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
