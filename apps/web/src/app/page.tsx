import { Badge } from '@tpmjs/ui/Badge/Badge';
import { Button } from '@tpmjs/ui/Button/Button';
import { Card, CardContent } from '@tpmjs/ui/Card/Card';
import { Container } from '@tpmjs/ui/Container/Container';
import { Header } from '@tpmjs/ui/Header/Header';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import { StatCard } from '@tpmjs/ui/StatCard/StatCard';
import Link from 'next/link';
import { ThemeToggle } from '../components/ThemeToggle';
import { CategoryGrid } from '../components/home/CategoryGrid';
import { HeroSection } from '../components/home/HeroSection';
import { categories, featuredTools, statistics } from '../data/homePageData';

export default function HomePage(): React.ReactElement {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <Header
        title={
          <Link
            href="/"
            className="text-foreground hover:text-foreground text-xl md:text-2xl font-bold uppercase tracking-tight"
          >
            TPMJS
          </Link>
        }
        size="md"
        sticky={true}
        actions={
          <div className="flex items-center gap-4">
            <Link href="/playground">
              <Button variant="ghost" size="sm" className="text-foreground hover:text-foreground">
                Playground
              </Button>
            </Link>
            <Button variant="ghost" size="sm" className="text-foreground hover:text-foreground">
              Pro
            </Button>
            <Button variant="ghost" size="sm" className="text-foreground hover:text-foreground">
              Teams
            </Button>
            <Button variant="ghost" size="sm" className="text-foreground hover:text-foreground">
              Pricing
            </Button>
            <Button variant="ghost" size="sm" className="text-foreground hover:text-foreground">
              Documentation
            </Button>
            <Button variant="secondary" size="sm">
              Sign In
            </Button>
            <Button size="sm">Sign Up</Button>
            <ThemeToggle />
          </div>
        }
      />

      <main className="flex-1">
        {/* Hero Section - Brutalist Design */}
        <HeroSection />

        {/* Featured Tools Section - Brutalist Cards */}
        <section className="py-16 md:py-24 bg-background">
          <Container size="xl" padding="lg">
            <div className="flex items-center justify-between mb-12">
              <h2 className="brutalist-subheading">Featured Tools</h2>
              <Button variant="ghost" className="uppercase tracking-wider font-bold">
                View all →
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredTools.map((tool, index) => (
                <Card
                  key={tool.id}
                  variant="brutalist"
                  className={`opacity-0 animate-brutalist-entrance stagger-${index % 6}`}
                >
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-start gap-4">
                      <Icon icon={tool.icon} size="lg" className="text-brutalist-accent" />
                      <div className="flex-1 space-y-2">
                        <h3 className="text-lg font-bold uppercase tracking-tight">{tool.name}</h3>
                        <p className="text-sm text-foreground-secondary leading-relaxed">
                          {tool.description}
                        </p>
                        <div className="flex items-center gap-3 pt-2">
                          <Badge
                            variant={tool.categoryVariant}
                            size="sm"
                            className="uppercase font-mono text-xs"
                          >
                            {tool.category}
                          </Badge>
                          <span className="text-sm font-mono font-bold text-foreground">
                            {tool.weeklyUsage}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </Container>
        </section>

        {/* Categories Section - Brutalist Masonry Grid */}
        <section className="py-16 md:py-24 bg-surface">
          <Container size="xl" padding="lg">
            <h2 className="brutalist-subheading mb-12">Browse by Category</h2>
            <CategoryGrid categories={categories} />
          </Container>
        </section>

        {/* Statistics Section - Brutalist Stat Cards */}
        <section className="py-16 md:py-24 bg-background relative overflow-hidden">
          {/* Subtle grid background */}
          <div className="absolute inset-0 opacity-[0.02] grid-background" />

          <Container size="xl" padding="lg" className="relative z-10">
            <h2 className="brutalist-subheading mb-12 text-center">Platform Statistics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {statistics.map((stat, index) => {
                // Extract number from value string
                const numValue = Number.parseInt(stat.value.replace(/[^0-9]/g, ''), 10);
                const suffix = stat.value.replace(/[0-9,]/g, '');

                return (
                  <StatCard
                    key={stat.label}
                    value={numValue}
                    label={stat.label}
                    subtext={stat.subtext}
                    suffix={suffix}
                    variant="brutalist"
                    size="md"
                    showBar={true}
                    barProgress={60 + index * 10}
                    className={`opacity-0 animate-brutalist-entrance stagger-${index + 1}`}
                  />
                );
              })}
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
