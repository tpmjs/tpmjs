import { OverviewSlideshow } from '@/components/OverviewSlideshow';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Overview | TPMJS Tutorials',
  description:
    'General overview of TPMJS - the tool registry for AI agents. Learn what TPMJS is, how it works, and who uses it.',
};

export default function OverviewPage(): React.ReactElement {
  return (
    <main className="h-screen w-screen overflow-hidden">
      <OverviewSlideshow />
    </main>
  );
}
