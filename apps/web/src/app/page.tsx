import { prisma } from '@tpmjs/db';
import { Badge } from '@tpmjs/ui/Badge/Badge';
import { Button } from '@tpmjs/ui/Button/Button';
import { Container } from '@tpmjs/ui/Container/Container';
import Link from 'next/link';
import { AppHeader } from '../components/AppHeader';
import { HeroSection } from '../components/home/HeroSection';

export const dynamic = 'force-dynamic';

async function getHomePageData() {
  try {
    // Fetch stats in parallel
    const [packageCount, toolCount, featuredTools, categoryStats] = await Promise.all([
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
                  <Link
                    key={tool.id}
                    href={`/tool/${tool.package.npmPackageName}/${tool.name}`}
                    className="group"
                  >
                    <div className="p-6 border border-border rounded-lg bg-surface hover:border-foreground transition-colors h-full flex flex-col">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-lg font-semibold text-foreground group-hover:text-brutalist-accent transition-colors">
                          {tool.package.npmPackageName}
                          <span className="text-xs text-foreground-tertiary ml-2">
                            ({tool.name})
                          </span>
                        </h3>
                        {tool.package.isOfficial && (
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
                          {tool.package.category}
                        </Badge>
                      </div>

                      <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-xs text-foreground-tertiary">
                        <span>
                          Quality:{' '}
                          {tool.qualityScore ? Number(tool.qualityScore).toFixed(2) : 'N/A'}
                        </span>
                        <span>
                          {tool.package.npmDownloadsLastMonth?.toLocaleString() || '0'} downloads/mo
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
                integration with Vercel AI SDK, LangChain, and more.
              </p>

              {/* Generator Highlight Box */}
              <div className="mb-12 p-6 border-2 border-primary/50 rounded-lg bg-primary/5 text-left">
                <div className="flex items-start gap-4">
                  <div className="text-4xl">✨</div>
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
    </>
  );
}
