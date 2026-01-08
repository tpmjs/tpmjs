import { Icon } from '@tpmjs/ui/Icon/Icon';
import Link from 'next/link';
import { AppFooter } from '~/components/AppFooter';
import { AppHeader } from '~/components/AppHeader';

interface Tutorial {
  title: string;
  description: string;
  icon: string;
  href: string;
  duration: string;
  steps: number;
}

const tutorials: Tutorial[] = [
  {
    title: 'Build Your First AI Agent',
    description:
      'Create a custom AI assistant with tool integration and persistent conversations. Learn how to set up API keys, configure agents, and attach tools.',
    icon: '🤖',
    href: '/docs/tutorials/agents',
    duration: '5 min',
    steps: 7,
  },
  {
    title: 'Connect MCP to Your AI',
    description:
      'Add TPMJS tools to Claude Desktop, Cursor, or any MCP-compatible client. Create collections and configure your AI to use external tools.',
    icon: '🔌',
    href: '/docs/tutorials/mcp',
    duration: '4 min',
    steps: 8,
  },
  {
    title: 'Deploy Your Own Executor',
    description:
      'Run TPMJS tools on your own infrastructure. Deploy a custom executor to Vercel in minutes for full privacy, control, and custom environment variables.',
    icon: '🚀',
    href: '/docs/tutorials/custom-executor',
    duration: '10 min',
    steps: 6,
  },
];

export default function TutorialsPage(): React.ReactElement {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader />

      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-4 py-12">
          {/* Header */}
          <div className="mb-12">
            <div className="flex items-center gap-4 mb-6">
              <Link
                href="/docs"
                className="text-foreground-secondary hover:text-foreground transition-colors"
              >
                <Icon icon="arrowLeft" size="sm" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Tutorials</h1>
                <p className="text-foreground-secondary mt-1">
                  Step-by-step guides to get you started with TPMJS
                </p>
              </div>
            </div>
          </div>

          {/* Tutorial Cards */}
          <div className="space-y-6">
            {tutorials.map((tutorial) => (
              <Link key={tutorial.href} href={tutorial.href} className="block group">
                <div className="p-6 bg-surface-secondary rounded-lg border border-border hover:border-primary/50 transition-all hover:shadow-lg">
                  <div className="flex items-start gap-6">
                    <div className="text-5xl">{tutorial.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h2 className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
                          {tutorial.title}
                        </h2>
                      </div>
                      <p className="text-foreground-secondary mb-4">{tutorial.description}</p>
                      <div className="flex items-center gap-4 text-sm text-foreground-tertiary">
                        <span className="flex items-center gap-1">⏱️ {tutorial.duration}</span>
                        <span className="flex items-center gap-1">📄 {tutorial.steps} steps</span>
                      </div>
                    </div>
                    <div className="flex items-center text-foreground-tertiary group-hover:text-primary transition-colors text-xl">
                      →
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* More Resources */}
          <div className="mt-12 pt-8 border-t border-border">
            <h3 className="text-lg font-semibold text-foreground mb-4">More Resources</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <Link href="/docs">
                <div className="p-4 bg-background border border-border rounded-lg hover:border-primary/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">📚</span>
                    <div>
                      <p className="font-medium text-foreground">Full Documentation</p>
                      <p className="text-sm text-foreground-secondary">
                        Complete API reference and guides
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
              <Link href="/docs/agents">
                <div className="p-4 bg-background border border-border rounded-lg hover:border-primary/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🤖</span>
                    <div>
                      <p className="font-medium text-foreground">Agents Documentation</p>
                      <p className="text-sm text-foreground-secondary">
                        In-depth AI agents reference
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </main>

      <AppFooter />
    </div>
  );
}
