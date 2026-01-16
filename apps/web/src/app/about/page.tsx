import { Container } from '@tpmjs/ui/Container/Container';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import type { Metadata } from 'next';
import { AppHeader } from '~/components/AppHeader';

export const metadata: Metadata = {
  title: 'About',
  description: 'About TPMJS and its creator',
};

export default function AboutPage(): React.ReactElement {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <Container size="md" padding="lg" className="py-16">
        <h1 className="text-3xl font-bold mb-8 text-foreground">About TPMJS</h1>

        <div className="prose prose-neutral dark:prose-invert max-w-none">
          <p className="text-lg text-foreground-secondary mb-6">
            TPMJS (Tool Package Manager for JavaScript) is the npm registry for AI agent tools.
            It was started in 2024 to make it easy for developers to publish and discover tools
            that AI agents can use.
          </p>

          <h2 className="text-xl font-semibold mt-10 mb-4 text-foreground">Creator</h2>

          <p className="text-foreground-secondary mb-6">
            TPMJS was created by <strong>Ajax Davis</strong> (Thomas Davis).
          </p>

          <div className="flex items-center gap-6">
            <a
              href="https://x.com/ajaxdavis"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-foreground-secondary hover:text-primary transition-colors"
            >
              <Icon icon="x" size="md" />
              <span>@ajaxdavis</span>
            </a>

            <a
              href="https://ajaxdavis.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-foreground-secondary hover:text-primary transition-colors"
            >
              <Icon icon="globe" size="md" />
              <span>ajaxdavis.dev</span>
            </a>
          </div>
        </div>
      </Container>
    </div>
  );
}
