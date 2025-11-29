import { Button } from '@tpmjs/ui/Button/Button';
import { Container } from '@tpmjs/ui/Container/Container';
import { Header } from '@tpmjs/ui/Header/Header';
import Link from 'next/link';
import { ThemeToggle } from '../components/ThemeToggle';
import { HeroSection } from '../components/home/HeroSection';

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
            <Link href="/tool/tool-search">
              <Button variant="ghost" size="sm" className="text-foreground hover:text-foreground">
                Tools
              </Button>
            </Link>
            <Link href="/playground">
              <Button variant="ghost" size="sm" className="text-foreground hover:text-foreground">
                Playground
              </Button>
            </Link>
            <Link href="/publish">
              <Button variant="ghost" size="sm" className="text-foreground hover:text-foreground">
                Publish
              </Button>
            </Link>
            <Button variant="secondary" size="sm">
              Sign In
            </Button>
            <Button size="sm">Sign Up</Button>
            <ThemeToggle />
          </div>
        }
      />

      <main className="flex-1">
        {/* Hero Section - Dithered Design */}
        <HeroSection />

        {/* Featured Tools Section */}
        <section className="py-16 bg-background">
          <Container size="xl" padding="lg">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
                Discover AI Tools
              </h2>
              <p className="text-lg text-foreground-secondary max-w-2xl mx-auto mb-8">
                Browse our collection of AI-ready tools. Search, filter, and integrate the perfect
                tools for your AI agents.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link href="/tool/tool-search">
                  <Button size="lg" variant="default">
                    Browse All Tools
                  </Button>
                </Link>
                <Link href="/tool/tool-search">
                  <Button size="lg" variant="outline">
                    Search Tools
                  </Button>
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
              {/* Feature cards */}
              <div className="p-6 border border-border rounded-lg bg-surface">
                <div className="text-4xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold mb-2 text-foreground">Smart Search</h3>
                <p className="text-foreground-secondary">
                  Find tools by name, category, tags, or functionality. Advanced filters help you
                  discover exactly what you need.
                </p>
              </div>

              <div className="p-6 border border-border rounded-lg bg-surface">
                <div className="text-4xl mb-4">⚡</div>
                <h3 className="text-xl font-semibold mb-2 text-foreground">Quality Metrics</h3>
                <p className="text-foreground-secondary">
                  Every tool includes quality scores, download stats, and community feedback to help
                  you choose wisely.
                </p>
              </div>

              <div className="p-6 border border-border rounded-lg bg-surface">
                <div className="text-4xl mb-4">🤖</div>
                <h3 className="text-xl font-semibold mb-2 text-foreground">AI Agent Ready</h3>
                <p className="text-foreground-secondary">
                  All tools include AI agent integration guides, parameter specs, and usage
                  examples.
                </p>
              </div>
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
