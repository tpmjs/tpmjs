'use client';

import { Button } from '@tpmjs/ui/Button/Button';
import { Container } from '@tpmjs/ui/Container/Container';
import Link from 'next/link';
import { useEffect } from 'react';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): React.ReactElement {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Error boundary caught:', error);
  }, [error]);

  return (
    <main className="flex-1">
      <section className="py-24 bg-background min-h-screen flex items-center">
        <Container size="xl" padding="lg">
          <div className="max-w-2xl mx-auto text-center">
            {/* Error Icon */}
            <div className="mb-8">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-error/10 mb-4">
                <svg
                  className="w-12 h-12 text-error"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                  role="img"
                  aria-labelledby="error-icon-title"
                >
                  <title id="error-icon-title">Error warning icon</title>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-2">
                Something went wrong
              </h1>
              {/* Decorative divider */}
              <div className="h-1 w-24 bg-error mx-auto" />
            </div>

            {/* Error Message */}
            <p className="text-lg text-foreground-secondary mb-8 max-w-md mx-auto">
              An unexpected error occurred. This has been logged and we&apos;ll look into it.
            </p>

            {/* Error Details (in development) */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mb-8 p-4 bg-surface border border-border rounded-lg text-left max-w-lg mx-auto">
                <p className="text-xs font-mono text-foreground-tertiary mb-2">
                  Error Details (dev only):
                </p>
                <p className="text-sm font-mono text-error break-all">{error.message}</p>
                {error.digest && (
                  <p className="text-xs font-mono text-foreground-tertiary mt-2">
                    Digest: {error.digest}
                  </p>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button size="lg" variant="default" onClick={reset}>
                Try Again
              </Button>
              <Link href="/">
                <Button size="lg" variant="outline">
                  Go Home
                </Button>
              </Link>
            </div>

            {/* Helpful Links */}
            <div className="mt-12 pt-8 border-t border-border">
              <p className="text-sm text-foreground-tertiary mb-4">
                Need help or want to report this issue?
              </p>
              <div className="flex flex-wrap gap-4 justify-center text-sm">
                <a
                  href="https://github.com/tpmjs/tpmjs/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brutalist-accent hover:text-brutalist-accent-hover transition-colors"
                >
                  Report Issue
                </a>
                <Link
                  href="/tool/tool-search"
                  className="text-brutalist-accent hover:text-brutalist-accent-hover transition-colors"
                >
                  Browse Tools
                </Link>
                <Link
                  href="/how-it-works"
                  className="text-brutalist-accent hover:text-brutalist-accent-hover transition-colors"
                >
                  How It Works
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}
