import { Button } from '@tpmjs/ui/Button/Button';
import { Container } from '@tpmjs/ui/Container/Container';
import Link from 'next/link';
import { AppHeader } from '../components/AppHeader';

export default function NotFound(): React.ReactElement {
  return (
    <>
      <AppHeader />
      <main className="flex-1">
        <section className="py-24 bg-background min-h-[80vh] flex items-center">
          <Container size="xl" padding="lg">
            <div className="max-w-2xl mx-auto text-center">
              {/* 404 Error Code */}
              <div className="mb-8">
                <h1 className="text-8xl md:text-9xl font-bold text-foreground mb-2 tracking-tighter">
                  404
                </h1>
                {/* Decorative divider */}
                <div className="h-1 w-24 bg-brutalist-accent mx-auto" />
              </div>

              {/* Error Message */}
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                Page Not Found
              </h2>
              <p className="text-lg text-foreground-secondary mb-8 max-w-md mx-auto">
                The page you&apos;re looking for doesn&apos;t exist. It might have been moved or
                deleted.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link href="/">
                  <Button size="lg" variant="default">
                    Go Home
                  </Button>
                </Link>
                <Link href="/tool/tool-search">
                  <Button size="lg" variant="outline">
                    Browse Tools
                  </Button>
                </Link>
              </div>

              {/* Helpful Links */}
              <div className="mt-12 pt-8 border-t border-border">
                <p className="text-sm text-foreground-tertiary mb-4">
                  Looking for something specific?
                </p>
                <div className="flex flex-wrap gap-4 justify-center text-sm">
                  <Link
                    href="/how-it-works"
                    className="text-brutalist-accent hover:text-brutalist-accent-hover transition-colors"
                  >
                    How It Works
                  </Link>
                  <Link
                    href="/spec"
                    className="text-brutalist-accent hover:text-brutalist-accent-hover transition-colors"
                  >
                    Spec
                  </Link>
                  <Link
                    href="/sdk"
                    className="text-brutalist-accent hover:text-brutalist-accent-hover transition-colors"
                  >
                    SDK
                  </Link>
                  <Link
                    href="/publish"
                    className="text-brutalist-accent hover:text-brutalist-accent-hover transition-colors"
                  >
                    Publish Tool
                  </Link>
                </div>
              </div>
            </div>
          </Container>
        </section>
      </main>
    </>
  );
}
