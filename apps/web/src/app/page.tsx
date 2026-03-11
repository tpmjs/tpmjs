import { prisma } from '@tpmjs/db';
import { Badge } from '@tpmjs/ui/Badge/Badge';
import { Button } from '@tpmjs/ui/Button/Button';
import { Container } from '@tpmjs/ui/Container/Container';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import Link from 'next/link';
import { AppHeader } from '../components/AppHeader';
import { CopyButton } from '../components/CopyButton';
import { EcosystemStats } from '../components/home/EcosystemStats';
import { FeaturesSection } from '../components/home/FeaturesSection';
import { GetStartedSection } from '../components/home/GetStartedSection';
import { HeroSection } from '../components/home/HeroSection';
import { McpSection } from '../components/home/McpSection';
import { SocialProofSection } from '../components/home/SocialProofSection';

export const dynamic = 'force-dynamic';

async function getHomePageData() {
  try {
    // Fetch stats in parallel
    const [featuredTools, categoryStats, featuredScenarios, latestSnapshot] = await Promise.all([
      // Top 6 featured tools by quality score
      prisma.tool.findMany({
        orderBy: [{ qualityScore: 'desc' }, { package: { npmDownloadsLastMonth: 'desc' } }],
        take: 6,
        select: {
          id: true,
          name: true,
          description: true,
          qualityScore: true,
          likeCount: true,
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

      // Latest stats snapshot (pre-computed daily)
      prisma.statsSnapshot.findFirst({
        orderBy: { date: 'desc' },
        select: {
          totalTools: true,
          totalPackages: true,
          totalNpmDownloads: true,
          totalGithubStars: true,
          executionsTotal: true,
          executionsAvgTimeMs: true,
          activeDevs7d: true,
          totalSimulations: true,
          categories: true,
        },
      }),
    ]);

    // Always query all-time avg execution time (snapshot only has daily value)
    // If no snapshot, also query other live data as fallback
    let ecosystemStats: {
      publishedTools: number;
      activeDevelopers: number;
      totalExecutions: number;
      avgResponseMs: number | null;
      totalDownloads: number;
    };

    if (latestSnapshot) {
      const avgExecTime = await prisma.simulation.aggregate({
        where: { status: 'success', executionTimeMs: { not: null } },
        _avg: { executionTimeMs: true },
      });

      ecosystemStats = {
        publishedTools: latestSnapshot.totalTools,
        activeDevelopers: latestSnapshot.activeDevs7d,
        totalExecutions: latestSnapshot.totalSimulations,
        avgResponseMs: avgExecTime._avg.executionTimeMs
          ? Math.round(avgExecTime._avg.executionTimeMs)
          : null,
        totalDownloads: latestSnapshot.totalNpmDownloads,
      };
    } else {
      // No snapshot — query live data directly
      const [activeDevsResult, avgExecTime, npmDownloads] = await Promise.all([
        prisma.userActivity
          .groupBy({
            by: ['userId'],
            where: {
              createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
            },
          })
          .then((r) => r.length),
        prisma.simulation.aggregate({
          where: { status: 'success', executionTimeMs: { not: null } },
          _avg: { executionTimeMs: true },
        }),
        prisma.package.aggregate({ _sum: { npmDownloadsLastMonth: true } }),
      ]);

      ecosystemStats = {
        publishedTools: 0,
        activeDevelopers: activeDevsResult,
        totalExecutions: 0,
        avgResponseMs: avgExecTime._avg.executionTimeMs
          ? Math.round(avgExecTime._avg.executionTimeMs)
          : null,
        totalDownloads: npmDownloads._sum.npmDownloadsLastMonth ?? 0,
      };
    }

    // Use snapshot counts (pre-computed daily), falling back to category sum
    const packageCount =
      latestSnapshot?.totalPackages ?? categoryStats.reduce((sum, c) => sum + c._count._all, 0);
    const toolCount = latestSnapshot?.totalTools ?? ecosystemStats.publishedTools;

    return {
      stats: {
        packageCount,
        toolCount,
        categoryCount: categoryStats.length,
        totalDownloads: latestSnapshot?.totalNpmDownloads ?? ecosystemStats.totalDownloads,
        totalStars: latestSnapshot?.totalGithubStars ?? 0,
      },
      ecosystemStats,
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
        totalDownloads: 0,
        totalStars: 0,
      },
      ecosystemStats: {
        publishedTools: 0,
        activeDevelopers: 0,
        totalExecutions: 0,
        avgResponseMs: null,
        totalDownloads: 0,
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

        {/* Get Started - Install Script Section */}
        <GetStartedSection />

        {/* Ecosystem Stats */}
        <EcosystemStats stats={data.ecosystemStats} />

        {/* Social Proof */}
        <SocialProofSection />

        {/* Features Section */}
        <FeaturesSection toolCount={data.stats.toolCount} />

        {/* Featured Tools Section */}
        <section className="py-16 bg-background">
          <Container size="xl" padding="lg">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
                Top-Rated Tools
              </h2>
              <p className="text-lg text-foreground-secondary max-w-2xl mx-auto mb-8">
                Highest quality-scored tools in the registry. Each one is schema-validated,
                health-checked, and ready to use.
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
                        <div className="flex items-center gap-3">
                          {tool.qualityScore && Number(tool.qualityScore) > 0 ? (
                            <span className="flex items-center gap-1">
                              <span className="text-brutalist-accent">★</span>
                              {Number(tool.qualityScore).toFixed(2)}
                            </span>
                          ) : null}
                          {tool.likeCount > 0 && (
                            <span className="flex items-center gap-1">
                              <Icon icon="heart" className="w-3 h-3 text-error" />
                              {tool.likeCount}
                            </span>
                          )}
                        </div>
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
              <div className="text-center py-12 border border-dashed border-border rounded-lg">
                <div className="w-16 h-16 flex items-center justify-center border border-dashed border-border bg-surface mx-auto mb-4 rounded-lg">
                  <Icon icon="search" className="w-8 h-8 text-foreground-tertiary" />
                </div>
                <p className="text-foreground-secondary mb-2">Tools are being indexed from npm.</p>
                <p className="text-sm text-foreground-tertiary">
                  The registry continuously scans for packages with the{' '}
                  <code className="px-1.5 py-0.5 bg-surface border border-border text-xs font-mono">
                    tpmjs
                  </code>{' '}
                  keyword.{' '}
                  <Link href="/publish" className="text-primary hover:underline">
                    Publish your own
                  </Link>{' '}
                  to get started.
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/tool/tool-search">
                <Button size="lg" variant="default">
                  Browse All {data.stats.toolCount} Tools
                </Button>
              </Link>
              <Link href="/getting-started">
                <Button size="lg" variant="outline">
                  Get Started
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
                  Collections are validated with auto-generated test scenarios. Real tool calls,
                  real pass/fail results.
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

        {/* MCP Integration Section */}
        <McpSection toolCount={data.stats.toolCount} />

        {/* Publish Your Tool Section */}
        <section className="py-20 bg-surface border-t border-border">
          <Container size="xl" padding="lg">
            <div className="text-center max-w-3xl mx-auto">
              <p className="font-mono text-xs text-primary uppercase tracking-widest mb-3">
                for tool authors
              </p>
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
                Publish Your Tool
              </h2>
              <p className="text-lg text-foreground-secondary mb-12">
                Add one keyword to your package.json, publish to npm, and your tool is live on the
                registry within minutes. Automatic schema extraction, quality scoring, and MCP
                endpoints.
              </p>

              {/* Generator Highlight Box */}
              <div className="mb-12 p-6 md:p-8 border-2 border-primary rounded-lg bg-primary/5">
                <h3 className="text-xl font-bold mb-2 text-foreground">
                  Create a Tool Package in Seconds
                </h3>
                <p className="text-sm text-foreground-secondary mb-6 max-w-lg mx-auto">
                  Our CLI generator scaffolds a production-ready TPMJS tool package with 2-3 tools,
                  complete setup, and best practices baked in.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <div className="relative flex items-center bg-surface border-2 border-border rounded px-5 py-3 font-mono text-sm">
                    <span className="text-primary font-bold mr-3 select-none">$</span>
                    <code className="text-foreground select-all">
                      npx @tpmjs/create-basic-tools
                    </code>
                    <CopyButton text="npx @tpmjs/create-basic-tools" size="xs" className="ml-3" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-10">
                <div className="p-5 border border-dashed border-border bg-background">
                  <div className="w-10 h-10 flex items-center justify-center mb-3 border border-dashed border-border bg-surface mx-auto">
                    <span className="font-mono text-lg text-primary">1</span>
                  </div>
                  <h3 className="font-semibold mb-1 text-foreground">Quick Setup</h3>
                  <p className="text-sm text-foreground-secondary">
                    Add one keyword to package.json and publish to npm
                  </p>
                </div>
                <div className="p-5 border border-dashed border-border bg-background">
                  <div className="w-10 h-10 flex items-center justify-center mb-3 border border-dashed border-border bg-surface mx-auto">
                    <span className="font-mono text-lg text-primary">2</span>
                  </div>
                  <h3 className="font-semibold mb-1 text-foreground">Auto Discovery</h3>
                  <p className="text-sm text-foreground-secondary">
                    Your tool appears on tpmjs.com within 15 minutes
                  </p>
                </div>
                <div className="p-5 border border-dashed border-border bg-background">
                  <div className="w-10 h-10 flex items-center justify-center mb-3 border border-dashed border-border bg-surface mx-auto">
                    <span className="font-mono text-lg text-primary">3</span>
                  </div>
                  <h3 className="font-semibold mb-1 text-foreground">Quality Metrics</h3>
                  <p className="text-sm text-foreground-secondary">
                    Automatic scoring based on docs, downloads, and stars
                  </p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/publish">
                  <Button size="lg" variant="default">
                    Learn How to Publish
                  </Button>
                </Link>
                <a
                  href="https://github.com/tpmjs/tpmjs/tree/main/packages/tools/create-basic-tools#readme"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button size="lg" variant="outline">
                    <Icon icon="github" size="sm" className="mr-2" />
                    View Docs
                  </Button>
                </a>
              </div>
            </div>
          </Container>
        </section>
      </main>
    </>
  );
}
