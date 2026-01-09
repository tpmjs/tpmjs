/**
 * ProblemSection Component
 *
 * Shows the fragmented, static world before tpmjs.
 * Cards are rotated randomly to create visual chaos.
 */

'use client';

import { Card, CardContent } from '@tpmjs/ui/Card/Card';
import { Container } from '@tpmjs/ui/Container/Container';
import { DitherSectionHeader } from '@tpmjs/ui/DitherText/DitherSectionHeader';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import { problemPoints } from '../../data/homePageData';

export function ProblemSection(): React.ReactElement {
  return (
    <section className="py-16 md:py-24 bg-surface relative">
      {/* Subtle grid background */}
      <div className="absolute inset-0 opacity-[0.02] grid-background" />

      <Container size="xl" padding="lg" className="relative z-10">
        <DitherSectionHeader className="mb-12 text-center">THE PROBLEM</DitherSectionHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {problemPoints.map((problem, index) => {
            // Deterministic rotation for chaos effect (stable across renders)
            const rotation = (index % 2 === 0 ? 1 : -1) * (((index * 1.3) % 5) + 2);

            return (
              <div
                key={problem.title}
                className={`opacity-0 animate-brutalist-entrance stagger-${(index % 5) + 1}`}
                style={{
                  transform: `rotate(${rotation}deg)`,
                  transition: 'transform 200ms ease-out',
                }}
              >
                <Card
                  variant="brutalist"
                  className="h-full bg-surface border-2 border-foreground/30 hover:border-red-500"
                  style={{ borderRadius: 0 }}
                >
                  <CardContent className="p-6 space-y-4 h-full flex flex-col">
                    <Icon icon={problem.icon} size="lg" className="text-red-500" />
                    <div className="flex-1">
                      <h3 className="text-lg font-bold uppercase tracking-tight mb-3 text-foreground">
                        {problem.title}
                      </h3>
                      <p className="text-sm text-foreground-secondary leading-relaxed">
                        {problem.description}
                      </p>
                    </div>

                    {/* Dashed line to show disconnection */}
                    {index < problemPoints.length - 1 && (
                      <div className="hidden lg:block absolute -right-4 top-1/2 w-8 h-0.5 border-t-2 border-dashed border-foreground/20" />
                    )}
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>

        <div className="mt-12 text-center font-mono text-sm text-foreground-secondary uppercase tracking-wider">
          Agents stuck with static, manually-configured toolsets
        </div>
      </Container>
    </section>
  );
}
