import { prisma } from '@tpmjs/db';
import { Badge } from '@tpmjs/ui/Badge/Badge';
import { Button } from '@tpmjs/ui/Button/Button';
import { Container } from '@tpmjs/ui/Container/Container';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import Link from 'next/link';
import { AppHeader } from '../components/AppHeader';
// import { ArchitectureDiagramWrapper } from '../components/home/ArchitectureDiagramWrapper';
// import { FeaturesSection } from '../components/home/FeaturesSection';
import { HeroSection } from '../components/home/HeroSection';

export const dynamic = 'force-dynamic';

async function getHomePageData() {
  try {
    // Fetch stats in parallel
    const [packageCount, toolCount, featuredTools, categoryStats, featuredScenarios] =
      await Promise.all([
        // Total package count
        prisma.package.count(),

        // Total tool count
        prisma.tool.count(),

        // Top 6 featured tools by quality score
        prisma.tool.findMany({
          orderBy: [{ qualityScore: 'desc' }, { package: { npmDownloadsLastMonth: 'desc' } }],
          take: 6,
          select: {
            id: true,
            name: true,
            description: true,
            qualityScore: true,
            package: {
              select: {
                npmPackageName: true,
                category: true,
                npmDownloadsLastMonth: true,
                isOfficial: true,
              },
            },
          },
        }),

        // Category distribution for stats (group by package category)
        prisma.package.groupBy({
          by: ['category'],
          _count: {
            _all: true,
          },
        }),

        // Featured scenarios - mix of high quality, diverse, and fresh
        (async () => {
          // Get high quality scenarios
          const highQuality = await prisma.scenario.findMany({
            where: {
              collection: { isPublic: true },
              qualityScore: { gte: 0.3 },
              totalRuns: { gte: 1 },
            },
            orderBy: { qualityScore: 'desc' },
            take: 3,
            include: {
              collection: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  user: { select: { username: true } },
                },
              },
            },
          });

          // Get fresh scenarios (excluding already selected)
          const seenIds = new Set(highQuality.map((s) => s.id));
          const fresh = await prisma.scenario.findMany({
            where: {
              collection: { isPublic: true },
              id: { notIn: Array.from(seenIds) },
            },
            orderBy: { createdAt: 'desc' },
            take: 3,
            include: {
              collection: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  user: { select: { username: true } },
                },
              },
            },
          });

          return [...highQuality, ...fresh].slice(0, 6);
        })(),
      ]);

    return {
      stats: {
        packageCount,
        toolCount,
        categoryCount: categoryStats.length,
      },
      featuredTools,
      categories: categoryStats.slice(0, 5).map((c) => ({
        name: c.category,
        count: c._count._all,
      })),
      featuredScenarios,
    };
  } catch (error) {
    console.error('Failed to fetch homepage data:', error);
    return {
      stats: {
        packageCount: 0,
        toolCount: 0,
        categoryCount: 0,
      },
      featuredTools: [],
      categories: [],
      featuredScenarios: [],
    };
  }
}

export default async function HomePage(): Promise<React.ReactElement> {
  const data = await getHomePageData();
  return (
    <>
      <AppHeader />

      <main>
        {/* Hero Section - Dithered Design */}
        <HeroSection stats={data.stats} />

        {/* Features Section - Interactive & Animated - temporarily disabled
        <FeaturesSection />
        */}

        {/* Architecture Diagram Section - temporarily disabled
        <section className="py-16 bg-background border-b border-border">
          <Container size="xl" padding="lg">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
                How It Works
              </h2>
              <p className="text-lg text-foreground-secondary max-w-2xl mx-auto">
                Publish once to npm, reach every AI agent. Your tool goes live in minutes.
              </p>
            </div>
            <ArchitectureDiagramWrapper />
          </Container>
        </section>
        */}

        {/* Featured Tools Section */}
        <section className="py-16 bg-background">
          <Container size="xl" padding="lg">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
                Featured Tools
              </h2>
              <p className="text-lg text-foreground-secondary max-w-2xl mx-auto mb-8">
                Production-ready tools you can use today. Add to your AI agent in one line.
              </p>
            </div>

            {data.featuredTools.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-12">
                {data.featuredTools.map((tool) => (
                  <Link
                    key={tool.id}
                    href={`/tool/${tool.package.npmPackageName}/${tool.name}`}
                    className="group"
                  >
                    <div className="p-6 border border-border rounded-lg bg-surface hover:border-foreground transition-colors h-full flex flex-col">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <h3 className="text-lg font-semibold text-foreground group-hover:text-brutalist-accent transition-colors min-w-0 break-words">
                          {tool.package.npmPackageName}
                          <span className="text-xs text-foreground-tertiary ml-2">
                            ({tool.name})
                          </span>
                        </h3>
                        {tool.package.isOfficial && (
                          <Badge variant="default" size="sm" className="flex-shrink-0">
                            Official
                          </Badge>
                        )}
                      </div>

                      <p className="text-sm text-foreground-secondary mb-4 flex-1 line-clamp-3">
                        {tool.description}
                      </p>

                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" size="sm">
                          {tool.package.category}
                        </Badge>
                      </div>

                      <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-xs text-foreground-tertiary">
                        {tool.qualityScore && Number(tool.qualityScore) > 0 ? (
                          <span className="flex items-center gap-1">
                            <span className="text-brutalist-accent">★</span>
                            {Number(tool.qualityScore).toFixed(2)}
                          </span>
                        ) : (
                          <span />
                        )}
                        <span>
                          {(tool.package.npmDownloadsLastMonth ?? 0) > 0
                            ? `${tool.package.npmDownloadsLastMonth?.toLocaleString()} downloads/mo`
                            : 'New'}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-foreground-secondary">
                  No tools available yet. Check back soon!
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/tool/tool-search">
                <Button size="lg" variant="default">
                  Browse All {data.stats.toolCount} Tools
                </Button>
              </Link>
              <Link href="/tool/tool-search">
                <Button size="lg" variant="outline">
                  Search by Category
                </Button>
              </Link>
            </div>
          </Container>
        </section>

        {/* Featured Scenarios Section */}
        {data.featuredScenarios.length > 0 && (
          <section className="py-16 bg-surface border-t border-border">
            <Container size="xl" padding="lg">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
                  Test Scenarios
                </h2>
                <p className="text-lg text-foreground-secondary max-w-2xl mx-auto mb-8">
                  See how tool collections are tested with AI-generated scenarios. Real execution,
                  real results.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-12">
                {data.featuredScenarios.map((scenario) => {
                  const qualityPercent = Math.round(scenario.qualityScore * 100);
                  const qualityColor =
                    qualityPercent >= 70
                      ? 'text-success'
                      : qualityPercent >= 40
                        ? 'text-warning'
                        : 'text-foreground-tertiary';

                  return (
                    <Link
                      key={scenario.id}
                      href={
                        scenario.collection
                          ? `/@${scenario.collection.user.username}/collections/${scenario.collection.slug}/scenarios/${scenario.id}`
                          : `/scenarios/${scenario.id}`
                      }
                      className="group"
                    >
                      <div className="p-6 border border-border rounded-lg bg-background hover:border-foreground transition-colors h-full flex flex-col">
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <h3 className="text-lg font-semibold text-foreground group-hover:text-brutalist-accent transition-colors min-w-0 break-words line-clamp-1">
                            {scenario.name ||
                              (scenario.prompt.length > 50
                                ? `${scenario.prompt.slice(0, 50)}...`
                                : scenario.prompt)}
                          </h3>
                          {scenario.lastRunStatus === 'pass' && (
                            <Badge
                              size="sm"
                              className="flex-shrink-0 bg-success/10 text-success border-success/20"
                            >
                              <Icon icon="check" className="w-3 h-3 mr-1" />
                              Pass
                            </Badge>
                          )}
                          {scenario.lastRunStatus === 'fail' && (
                            <Badge
                              size="sm"
                              className="flex-shrink-0 bg-error/10 text-error border-error/20"
                            >
                              <Icon icon="x" className="w-3 h-3 mr-1" />
                              Fail
                            </Badge>
                          )}
                        </div>

                        <p className="text-sm text-foreground-secondary mb-4 flex-1 line-clamp-2">
                          {scenario.prompt}
                        </p>

                        {scenario.collection && (
                          <div className="flex items-center gap-2 mb-4">
                            <Badge variant="outline" size="sm">
                              {scenario.collection.name}
                            </Badge>
                            <span className="text-xs text-foreground-tertiary">
                              by @{scenario.collection.user.username}
                            </span>
                          </div>
                        )}

                        {scenario.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-4">
                            {scenario.tags.slice(0, 3).map((tag) => (
                              <Badge key={tag} variant="secondary" size="sm" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}

                        <div className="mt-auto pt-4 border-t border-border flex items-center justify-between text-xs text-foreground-tertiary">
                          <span className={`flex items-center gap-1 ${qualityColor}`}>
                            <Icon icon="star" className="w-3.5 h-3.5" />
                            {qualityPercent}% quality
                          </span>
                          <span>{scenario.totalRuns} runs</span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>

              <div className="flex justify-center">
                <Link href="/scenarios">
                  <Button size="lg" variant="outline">
                    Browse All Scenarios
                  </Button>
                </Link>
              </div>
            </Container>
          </section>
        )}

        {/* Integration Section */}
        <section className="py-20 bg-surface border-y border-border">
          <Container size="xl" padding="lg">
            {/* Section Header */}
            <div className="text-center mb-16">
              <p className="font-mono text-xs text-primary uppercase tracking-widest mb-3">
                universal compatibility
              </p>
              <h2 className="font-mono text-3xl md:text-4xl font-semibold mb-4 text-foreground lowercase">
                works everywhere
              </h2>
              <p className="text-base text-foreground-secondary max-w-xl mx-auto font-sans">
                Use TPMJS tools with any MCP-compatible AI client. One URL, instant access.
              </p>
            </div>

            {/* Client Cards - Fieldset Style */}
            <fieldset className="border border-dashed border-border p-8 mb-12">
              <legend className="font-mono text-sm text-foreground-secondary px-3 lowercase">
                supported clients
              </legend>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="group p-6 border border-dashed border-border hover:border-primary hover:bg-primary/5 transition-all">
                  <div className="w-10 h-10 bg-primary/10 flex items-center justify-center mb-4">
                    <span className="font-mono text-lg text-primary">C</span>
                  </div>
                  <div className="font-mono text-lg font-medium text-foreground group-hover:text-primary transition-colors">
                    Claude
                  </div>
                  <p className="font-mono text-xs text-foreground-tertiary mt-1">
                    desktop / projects / api
                  </p>
                </div>
                <div className="group p-6 border border-dashed border-border hover:border-primary hover:bg-primary/5 transition-all">
                  <div className="w-10 h-10 bg-primary/10 flex items-center justify-center mb-4">
                    <span className="font-mono text-lg text-primary">{'>_'}</span>
                  </div>
                  <div className="font-mono text-lg font-medium text-foreground group-hover:text-primary transition-colors">
                    Cursor
                  </div>
                  <p className="font-mono text-xs text-foreground-tertiary mt-1">
                    ai-powered code editor
                  </p>
                </div>
                <div className="group p-6 border border-dashed border-border hover:border-primary hover:bg-primary/5 transition-all">
                  <div className="w-10 h-10 bg-primary/10 flex items-center justify-center mb-4">
                    <span className="font-mono text-lg text-primary">W</span>
                  </div>
                  <div className="font-mono text-lg font-medium text-foreground group-hover:text-primary transition-colors">
                    Windsurf
                  </div>
                  <p className="font-mono text-xs text-foreground-tertiary mt-1">agentic ide</p>
                </div>
                <div className="group p-6 border border-dashed border-border hover:border-primary hover:bg-primary/5 transition-all">
                  <div className="w-10 h-10 bg-primary/10 flex items-center justify-center mb-4">
                    <span className="font-mono text-lg text-primary">*</span>
                  </div>
                  <div className="font-mono text-lg font-medium text-foreground group-hover:text-primary transition-colors">
                    Any MCP
                  </div>
                  <p className="font-mono text-xs text-foreground-tertiary mt-1">
                    open protocol support
                  </p>
                </div>
              </div>
            </fieldset>

            {/* Code Example - Fieldset Style */}
            <fieldset className="border border-dashed border-border p-8 max-w-2xl mx-auto">
              <legend className="font-mono text-sm text-foreground-secondary px-3 lowercase">
                quick start
              </legend>
              <div className="mb-4">
                <p className="font-mono text-xs text-foreground-tertiary uppercase tracking-wider mb-2">
                  claude_desktop_config.json
                </p>
                <div className="bg-background border border-border p-4 font-mono text-sm overflow-x-auto">
                  <pre className="text-foreground">
                    <span className="text-foreground-tertiary">{'{'}</span>
                    {'\n  '}
                    <span className="text-primary">"mcpServers"</span>:{' '}
                    <span className="text-foreground-tertiary">{'{'}</span>
                    {'\n    '}
                    <span className="text-primary">"tpmjs"</span>:{' '}
                    <span className="text-foreground-tertiary">{'{'}</span>
                    {'\n      '}
                    <span className="text-primary">"command"</span>:{' '}
                    <span className="text-success">"npx"</span>,{'\n      '}
                    <span className="text-primary">"args"</span>: [
                    <span className="text-success">"-y"</span>,{' '}
                    <span className="text-success">"@anthropic/mcp-remote"</span>,{'\n        '}
                    <span className="text-success">
                      "https://tpmjs.com/api/mcp/ajax/ajax-collection/sse"
                    </span>
                    ]{'\n    '}
                    <span className="text-foreground-tertiary">{'}'}</span>
                    {'\n  '}
                    <span className="text-foreground-tertiary">{'}'}</span>
                    {'\n'}
                    <span className="text-foreground-tertiary">{'}'}</span>
                  </pre>
                </div>
              </div>
              <div className="flex items-center gap-3 pt-4 border-t border-dashed border-border">
                <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
                <p className="font-mono text-xs text-foreground-secondary">
                  add to config → instant access to{' '}
                  <span className="text-primary font-medium">170+ tools</span>
                </p>
              </div>
            </fieldset>
          </Container>
        </section>

        {/* Publish Your Tool Section */}
        <section className="py-16 bg-surface">
          <Container size="xl" padding="lg">
            <div className="text-center max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
                Publish Your AI Tool
              </h2>
              <p className="text-lg text-foreground-secondary mb-8">
                Share your tool with the AI community. Automatic discovery, quality scoring, and
                integration with Vercel AI SDK, LangChain, and more.
              </p>

              {/* Generator Highlight Box */}
              <div className="mb-12 p-6 border-2 border-primary/50 rounded-lg bg-primary/5 text-left">
                <div className="flex flex-col sm:flex-row items-start gap-4">
                  <div className="text-3xl sm:text-4xl" aria-hidden="true">
                    ✨
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-2 text-foreground">
                      Start with Our Package Generator
                    </h3>
                    <p className="text-sm text-foreground-secondary mb-4">
                      Create a production-ready TPMJS tool package in seconds with our CLI
                      generator. Includes 2-3 tools, complete setup, and best practices.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <code className="text-sm bg-surface px-4 py-2 rounded text-foreground border border-border">
                        npx @tpmjs/create-basic-tools
                      </code>
                      <a
                        href="https://github.com/tpmjs/tpmjs/tree/main/packages/tools/create-basic-tools#readme"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button size="sm" variant="outline">
                          View Docs →
                        </Button>
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">
                <div className="p-4">
                  <div className="text-3xl mb-2" aria-hidden="true">
                    🚀
                  </div>
                  <h3 className="font-semibold mb-1 text-foreground">Quick Setup</h3>
                  <p className="text-sm text-foreground-secondary">
                    Add one keyword to package.json and publish to NPM
                  </p>
                </div>
                <div className="p-4">
                  <div className="text-3xl mb-2" aria-hidden="true">
                    ⚡
                  </div>
                  <h3 className="font-semibold mb-1 text-foreground">Auto Discovery</h3>
                  <p className="text-sm text-foreground-secondary">
                    Your tool appears on tpmjs.com within 15 minutes
                  </p>
                </div>
                <div className="p-4">
                  <div className="text-3xl mb-2" aria-hidden="true">
                    📊
                  </div>
                  <h3 className="font-semibold mb-1 text-foreground">Quality Metrics</h3>
                  <p className="text-sm text-foreground-secondary">
                    Automatic scoring based on docs, downloads, and stars
                  </p>
                </div>
              </div>
              <Link href="/publish">
                <Button size="lg" variant="default">
                  Learn How to Publish
                </Button>
              </Link>
            </div>
          </Container>
        </section>
      </main>
    </>
  );
}
