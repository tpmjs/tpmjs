import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Test Scenarios | TPMJS',
  description:
    'Browse AI-generated test scenarios that validate tool behavior. Track pass rates, latency, and quality scores.',
  openGraph: {
    title: 'Test Scenarios | TPMJS',
    description:
      'Browse AI-generated test scenarios that validate tool behavior. Track pass rates, latency, and quality scores.',
    images: [{ url: '/api/og/scenarios', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/api/og/scenarios'],
  },
};

export default function ScenariosLayout({ children }: { children: React.ReactNode }) {
  return children;
}
