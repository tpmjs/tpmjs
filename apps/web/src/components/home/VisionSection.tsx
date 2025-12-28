/**
 * VisionSection Component
 *
 * Shows the dynamic, connected ecosystem enabled by tpmjs.
 * Features animated flow diagram showing semantic discovery.
 */

'use client';

import { Container } from '@tpmjs/ui/Container/Container';
import { DitherSectionHeader } from '@tpmjs/ui/DitherText/DitherSectionHeader';
import { FlowDiagram } from '@tpmjs/ui/FlowDiagram/FlowDiagram';

export function VisionSection(): React.ReactElement {
  return (
    <section className="py-16 md:py-24 bg-background relative">
      {/* Blueprint grid with subtle pulse */}
      <div className="absolute inset-0 opacity-[0.03]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(to right, currentColor 1px, transparent 1px),
              linear-gradient(to bottom, currentColor 1px, transparent 1px)
            `,
            backgroundSize: '24px 24px',
          }}
        />
      </div>

      <Container size="xl" padding="lg" className="relative z-10">
        <DitherSectionHeader className="mb-12 text-center">THE VISION</DitherSectionHeader>

        <div className="opacity-0 animate-brutalist-entrance stagger-1 max-w-4xl mx-auto">
          <FlowDiagram className="mb-12" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
            <div className="text-center">
              <div className="text-4xl font-bold font-mono text-brutalist-accent mb-2">Dynamic</div>
              <p className="text-sm text-foreground-secondary">
                Agents discover tools on-demand through semantic search
              </p>
            </div>

            <div className="text-center">
              <div className="text-4xl font-bold font-mono text-brutalist-accent mb-2">
                Scalable
              </div>
              <p className="text-sm text-foreground-secondary">
                Thousands of tools available without manual integration
              </p>
            </div>

            <div className="text-center">
              <div className="text-4xl font-bold font-mono text-brutalist-accent mb-2">
                Evolving
              </div>
              <p className="text-sm text-foreground-secondary">
                New capabilities emerge as the community publishes tools
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center font-mono text-sm text-brutalist-accent uppercase tracking-wider">
          One registry. Thousands of tools. Zero configuration.
        </div>
      </Container>
    </section>
  );
}
