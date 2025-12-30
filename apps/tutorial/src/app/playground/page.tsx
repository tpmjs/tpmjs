import { PlaygroundSlideshow } from '@/components/PlaygroundSlideshow';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Interactive Playground | TPMJS Tutorials',
  description:
    'Learn how to use the TPMJS playground to test tools directly in your browser. No installation required.',
};

export default function PlaygroundPage(): React.ReactElement {
  return (
    <main className="h-screen w-screen overflow-hidden">
      <PlaygroundSlideshow />
    </main>
  );
}
