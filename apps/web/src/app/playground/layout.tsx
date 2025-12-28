import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'UI Component Playground | TPMJS',
  description: 'Interactive playground to explore and test TPMJS UI components',
  openGraph: {
    title: 'UI Component Playground | TPMJS',
    description: 'Interactive playground to explore and test TPMJS UI components',
    images: [{ url: '/api/og/playground', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/api/og/playground'],
  },
};

export default function PlaygroundLayout({ children }: { children: React.ReactNode }) {
  return children;
}
