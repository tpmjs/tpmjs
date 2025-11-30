import { prisma } from '@tpmjs/db';
import { Badge } from '@tpmjs/ui/Badge/Badge';
import { Button } from '@tpmjs/ui/Button/Button';
import { Container } from '@tpmjs/ui/Container/Container';
import Link from 'next/link';
import { AppHeader } from '../components/AppHeader';
import { HeroSection } from '../components/home/HeroSection';

async function getHomePageData() {
  try {
    // Fetch stats in parallel
    const [toolCount, simulationCount, featuredTools, categoryStats] = await Promise.all([
      // Total tool count
      prisma.tool.count(),

      // Total successful simulations (as proxy for invocations)
      prisma.simulation.count({
        where: { status: 'success' },
      }),

      // Top 6 featured tools by quality score
      prisma.tool.findMany({
        orderBy: [{ qualityScore: 'desc' }, { npmDownloadsLastMonth: 'desc' }],
        take: 6,
        select: {
          id: true,
          npmPackageName: true,
          description: true,
          category: true,
          tags: true,
          qualityScore: true,
          npmDownloadsLastMonth: true,
          isOfficial: true,
        },
      }),

      // Category distribution for stats
      prisma.tool.groupBy({
        by: ['category'],
        _count: true,
      }),
    ]);

    // Calculate average latency from recent successful simulations
    const recentSimulations = await prisma.simulation.findMany({
      where: {
        status: 'success',
        executionTimeMs: { not: null },
      },
      select: { executionTimeMs: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const avgLatency =
      recentSimulations.length > 0
        ? Math.round(
            recentSimulations.reduce((sum, s) => sum + (s.executionTimeMs || 0), 0) /
              recentSimulations.length
          )
        : 0;

    return {
      stats: {
        toolCount,
        invocations: simulationCount,
        avgLatency,
        categoryCount: categoryStats.length,
      },
      featuredTools,
      categories: categoryStats.slice(0, 5).map((c) => ({
        name: c.category,
        count: c._count,
      })),
    };
  } catch (error) {
    console.error('Failed to fetch homepage data:', error);
    return {
      stats: {
        toolCount: 0,
        invocations: 0,
        avgLatency: 0,
        categoryCount: 0,
      },
      featuredTools: [],
      categories: [],
    };
  }
}

export default async function HomePage(): Promise<React.ReactElement> {
  const data = await getHomePageData();
  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />

      <main className="flex-1">
        {/* Hero Section - Dithered Design */}
        <HeroSection stats={data.stats} />

        {/* Featured Tools Section */}
        <section className="py-16 bg-background">
          <Container size="xl" padding="lg">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
                Featured Tools
              </h2>
              <p className="text-lg text-foreground-secondary max-w-2xl mx-auto mb-8">
                Top-rated tools from our registry. Sorted by quality score and community adoption.
              </p>
            </div>

            {data.featuredTools.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                {data.featuredTools.map((tool) => (
                  <Link key={tool.id} href={`/tool/${tool.npmPackageName}`} className="group">
                    <div className="p-6 border border-border rounded-lg bg-surface hover:border-foreground transition-colors h-full flex flex-col">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-lg font-semibold text-foreground group-hover:text-brutalist-accent transition-colors">
                          {tool.npmPackageName}
                        </h3>
                        {tool.isOfficial && (
                          <Badge variant="default" size="sm">
                            Official
                          </Badge>
                        )}
                      </div>

                      <p className="text-sm text-foreground-secondary mb-4 flex-1 line-clamp-3">
                        {tool.description}
                      </p>

                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" size="sm">
                          {tool.category}
                        </Badge>
                        {tool.tags.slice(0, 2).map((tag) => (
                          <Badge key={tag} variant="secondary" size="sm">
                            {tag}
                          </Badge>
                        ))}
                      </div>

                      <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-xs text-foreground-tertiary">
                        <span>
                          Quality:{' '}
                          {tool.qualityScore ? Number(tool.qualityScore).toFixed(2) : 'N/A'}
                        </span>
                        <span>
                          {tool.npmDownloadsLastMonth?.toLocaleString() || '0'} downloads/mo
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

        {/* Publish Your Tool Section */}
        <section className="py-16 bg-surface">
          <Container size="xl" padding="lg">
            <div className="text-center max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
                Publish Your AI Tool
              </h2>
              <p className="text-lg text-foreground-secondary mb-8">
                Share your tool with the AI community. Automatic discovery, quality scoring, and
                seamless integration with popular AI frameworks.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="p-4">
                  <div className="text-3xl mb-2">🚀</div>
                  <h3 className="font-semibold mb-1 text-foreground">Quick Setup</h3>
                  <p className="text-sm text-foreground-secondary">
                    Add one keyword to package.json and publish to NPM
                  </p>
                </div>
                <div className="p-4">
                  <div className="text-3xl mb-2">⚡</div>
                  <h3 className="font-semibold mb-1 text-foreground">Auto Discovery</h3>
                  <p className="text-sm text-foreground-secondary">
                    Your tool appears on tpmjs.com within 15 minutes
                  </p>
                </div>
                <div className="p-4">
                  <div className="text-3xl mb-2">📊</div>
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

      {/* Footer */}
      <footer className="py-8 border-t border-border bg-surface">
        <Container size="xl" padding="lg">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-foreground-secondary">© 2025 TPMJS. All rights reserved.</p>
            <div className="flex items-center gap-4 text-sm">
              <button type="button" className="text-foreground-secondary hover:text-foreground">
                Privacy
              </button>
              <span className="text-border">·</span>
              <button type="button" className="text-foreground-secondary hover:text-foreground">
                Terms
              </button>
              <span className="text-border">·</span>
              <button type="button" className="text-foreground-secondary hover:text-foreground">
                Contact
              </button>
            </div>
          </div>
        </Container>
      </footer>
    </div>
  );
}
