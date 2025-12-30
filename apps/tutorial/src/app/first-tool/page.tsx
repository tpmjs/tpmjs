import { FirstToolSlideshow } from '@/components/FirstToolSlideshow';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Build Your First Tool | TPMJS Tutorials',
  description:
    'Step-by-step guide to creating your first AI SDK tool for the TPMJS registry. From npm init to published tool in 10 minutes.',
};

export default function FirstToolPage(): React.ReactElement {
  return (
    <main className="h-screen w-screen overflow-hidden">
      <FirstToolSlideshow />
    </main>
  );
}
