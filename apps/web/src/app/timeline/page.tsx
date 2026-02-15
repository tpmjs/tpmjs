import type { Metadata } from 'next';
import { AppHeader } from '~/components/AppHeader';
import { TimelineView } from '~/components/timeline/TimelineView';

export const metadata: Metadata = {
  title: 'Development Timeline | TPMJS',
  description:
    'Interactive timeline of the entire TPMJS development history. Explore commits, milestones, and project evolution.',
};

export default function TimelinePage(): React.ReactElement {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader />
      <main className="flex-1">
        <div className="max-w-full mx-auto px-4 sm:px-6 py-8 sm:py-12">
          {/* Header */}
          <div className="text-center mb-8 sm:mb-12">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 text-foreground">
              TPMJS Development Timeline
            </h1>
            <p className="text-lg text-foreground-secondary max-w-2xl mx-auto">
              Full development history from day one. Drag to pan, scroll to zoom, filter by commit
              type, and click milestones to jump.
            </p>
          </div>

          {/* Timeline */}
          <TimelineView />

          {/* Legend */}
          <div className="mt-8 sm:mt-12 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {[
              { label: 'Feature', color: 'bg-green-600' },
              { label: 'Bug Fix', color: 'bg-yellow-500' },
              { label: 'Refactor', color: 'bg-purple-500' },
              { label: 'Docs', color: 'bg-blue-500' },
              { label: 'Chore', color: 'bg-gray-500' },
              { label: 'Test', color: 'bg-teal-500' },
              { label: 'CI', color: 'bg-emerald-600' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded ${item.color}`} />
                <span className="text-sm text-foreground-secondary">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
