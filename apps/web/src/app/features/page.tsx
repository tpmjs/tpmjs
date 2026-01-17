'use client';

import { AppHeader } from '../../components/AppHeader';
import { FeaturesSection } from '../../components/home/FeaturesSection';

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
