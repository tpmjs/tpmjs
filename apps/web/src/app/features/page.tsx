import type { Metadata } from 'next';
import { AppHeader } from '../../components/AppHeader';
import { FeaturesSection } from '../../components/home/FeaturesSection';

export const metadata: Metadata = {
  title: 'Features',
  description:
    'TPMJS features: tool registry, MCP protocol support, secure execution, collections, agents, test scenarios, SDK, and more.',
};

export default function FeaturesPage(): React.ReactElement {
  return (
    <>
      <AppHeader />
      <main>
        <FeaturesSection />
      </main>
    </>
  );
}
