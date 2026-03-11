import { Button } from '@tpmjs/ui/Button/Button';
import { Container } from '@tpmjs/ui/Container/Container';
import type { IconName } from '@tpmjs/ui/Icon/Icon';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import type { Metadata } from 'next';
import Link from 'next/link';
import { AppHeader } from '~/components/AppHeader';

export const metadata: Metadata = {
  title: 'Get Started',
  description:
    'Choose your path: use AI tools, publish tools, try the playground, or build custom agents.',
};

interface PathwayCard {
  icon: IconName;
  title: string;
  audience: string;
  description: string;
  steps: string[];
  ctaLabel: string;
  ctaHref: string;
}

const pathways: PathwayCard[] = [
  {
    icon: 'search',
    title: 'Use AI Tools',
    audience: 'AI engineers',
    description: 'Browse the registry, add tools to your agent via MCP, SDK, or API',
    steps: [
      'Browse tools at /tool/tool-search',
      'Create a collection',
      'Connect via MCP URL or SDK',
    ],
    ctaLabel: 'Browse Tools',
    ctaHref: '/tool/tool-search',
  },
  {
    icon: 'terminal',
    title: 'Publish a Tool',
    audience: 'Tool developers',
    description: 'Publish an npm package with the tpmjs keyword and it auto-discovers in minutes',
    steps: [
      'Run npx @tpmjs/create-basic-tools',
      'npm publish',
      'Tool appears in registry within 15 minutes',
    ],
    ctaLabel: 'Publishing Guide',
    ctaHref: '/publish',
  },
  {
    icon: 'puzzle',
    title: 'Try the Playground',
    audience: 'Curious visitors',
    description: 'Chat with Omega — an AI agent that discovers and runs tools on the fly',
    steps: ['Open Omega', 'Ask it to do something', 'Watch it find and run tools'],
    ctaLabel: 'Try Omega',
    ctaHref: '/omega',
  },
  {
    icon: 'user',
    title: 'Build Custom Agents',
    audience: 'Agent builders',
    description: 'Create agents with any LLM, custom prompts, and curated tool collections',
    steps: ['Sign up', 'Create an agent in the dashboard', 'Add tools and test'],
    ctaLabel: 'Create Agent',
    ctaHref: '/dashboard/agents/new',
  },
];

const footerLinks = [
  { label: 'Documentation', href: '/docs' },
  { label: 'API Reference', href: '/docs/api' },
  { label: 'SDK', href: '/sdk' },
  { label: 'FAQ', href: '/faq' },
];

export default function GettingStartedPage(): React.ReactElement {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader />

      <main className="flex-1 py-16">
        <Container size="lg" padding="lg">
          {/* Hero */}
          <div className="text-center mb-16">
            <p className="font-mono text-xs text-primary uppercase tracking-widest mb-3">
              choose your path
            </p>
            <h1 className="font-mono text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-foreground lowercase">
              get started
            </h1>
            <p className="text-lg text-foreground-secondary max-w-2xl mx-auto font-sans">
              TPMJS is the npm for AI tools. Pick the path that fits what you want to do.
            </p>
          </div>

          {/* Pathway Cards */}
          <section className="mb-20">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {pathways.map((pathway) => (
                <div
                  key={pathway.title}
                  className="group p-6 border border-dashed border-border bg-surface hover:border-primary hover:bg-primary/5 transition-all duration-200 flex flex-col"
                >
                  {/* Icon + Badge */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 flex items-center justify-center border border-dashed border-border bg-background group-hover:border-primary group-hover:bg-primary/10 transition-all duration-200">
                      <Icon
                        icon={pathway.icon}
                        size="md"
                        className="text-foreground-secondary group-hover:text-primary transition-colors duration-200"
                      />
                    </div>
                    <span className="font-mono text-xs text-foreground-tertiary uppercase tracking-wide">
                      {pathway.audience}
                    </span>
                  </div>

                  {/* Title + Description */}
                  <h2 className="font-mono text-lg font-semibold text-foreground lowercase group-hover:text-primary transition-colors mb-2">
                    {pathway.title}
                  </h2>
                  <p className="font-sans text-sm text-foreground-secondary leading-relaxed mb-4">
                    {pathway.description}
                  </p>

                  {/* Steps */}
                  <ol className="space-y-2 mb-6 flex-1">
                    {pathway.steps.map((step, i) => (
                      <li key={step} className="flex items-start gap-3 text-sm">
                        <span className="font-mono text-xs font-bold text-primary bg-primary/10 w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <span className="text-foreground">{step}</span>
                      </li>
                    ))}
                  </ol>

                  {/* CTA */}
                  <Link href={pathway.ctaHref}>
                    <Button variant="outline" size="sm" className="w-full">
                      {pathway.ctaLabel}
                      <Icon icon="arrowRight" size="sm" className="ml-1" />
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </section>

          {/* Quick Setup */}
          <section className="mb-20">
            <div className="border border-dashed border-border bg-surface p-8">
              <div className="text-center mb-6">
                <h2 className="font-mono text-xl md:text-2xl font-semibold text-foreground lowercase mb-2">
                  quick setup
                </h2>
                <p className="text-sm text-foreground-secondary font-sans">
                  One command to connect TPMJS tools to your editor. Supports Claude Code, Cursor,
                  and Windsurf.
                </p>
              </div>

              <div className="bg-background border border-border p-4 font-mono text-sm text-foreground mb-6 max-w-xl mx-auto">
                <span className="text-foreground-tertiary select-none">$ </span>
                npx @anthropic-ai/tpmjs setup
              </div>

              <div className="text-center">
                <Link href="/setup">
                  <Button variant="outline" size="sm">
                    Full Configuration Guide
                    <Icon icon="arrowRight" size="sm" className="ml-1" />
                  </Button>
                </Link>
              </div>
            </div>
          </section>

          {/* Links */}
          <section>
            <div className="border-t border-border pt-8">
              <h2 className="font-mono text-lg font-semibold text-foreground lowercase mb-6 text-center">
                resources
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {footerLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="group flex items-center justify-center gap-2 p-4 border border-dashed border-border bg-surface hover:border-primary hover:bg-primary/5 transition-all duration-200 text-sm font-mono text-foreground hover:text-primary"
                  >
                    {link.label}
                    <Icon
                      icon="arrowRight"
                      size="sm"
                      className="text-foreground-tertiary group-hover:text-primary transition-colors"
                    />
                  </Link>
                ))}
              </div>
            </div>
          </section>
        </Container>
      </main>
    </div>
  );
}
