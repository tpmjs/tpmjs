import { AgentExampleSlideshow } from '@/components/AgentExampleSlideshow';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Real-World Agent Example | TPMJS Tutorials',
  description:
    'Build a complete AI agent that discovers and uses tools dynamically from the TPMJS registry. Working code examples included.',
};

export default function AgentExamplePage(): React.ReactElement {
  return (
    <main className="h-screen w-screen overflow-hidden">
      <AgentExampleSlideshow />
    </main>
  );
}
