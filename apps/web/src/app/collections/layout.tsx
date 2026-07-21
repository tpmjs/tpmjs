import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Public Collections',
  description:
    'Browse tool collections on TPMJS. Collections group related AI tools into shareable workflow bundles with test scenarios.',
  alternates: { canonical: '/collections' },
  robots: { index: true, follow: true },
  openGraph: {
    title: 'Public Collections | TPMJS',
    description:
      'Browse tool collections on TPMJS. Collections group related AI tools into shareable workflow bundles with test scenarios.',
    images: [{ url: '/api/og/collections', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/api/og/collections'],
  },
};

export default function CollectionsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
