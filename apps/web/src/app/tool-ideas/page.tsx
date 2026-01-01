import { Container } from '@tpmjs/ui/Container/Container';
import type { Metadata } from 'next';
import { ToolIdeasClient } from './ToolIdeasClient';

export const metadata: Metadata = {
  title: 'Tool Ideas | TPMJS',
  description: 'Browse 10,000 AI-generated tool ideas for agents',
};

export const dynamic = 'force-dynamic';

export default function ToolIdeasPage() {
  return (
    <main className="min-h-screen bg-background py-8">
      <Container size="xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Tool Ideas</h1>
          <p className="text-foreground-secondary">
            Browse 10,000 AI-generated tool ideas for agents. Filter by category, quality score, or
            search.
          </p>
        </div>
        <ToolIdeasClient />
      </Container>
    </main>
  );
}
