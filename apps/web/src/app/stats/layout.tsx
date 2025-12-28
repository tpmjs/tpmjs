import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Registry Statistics | TPMJS',
  description:
    'Real-time metrics and analytics for the TPMJS tool registry. View tool counts, health status, execution statistics, and more.',
  openGraph: {
    title: 'Registry Statistics | TPMJS',
    description:
      'Real-time metrics and analytics for the TPMJS tool registry. View tool counts, health status, execution statistics, and more.',
    images: [{ url: '/api/og/stats', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/api/og/stats'],
  },
};

export default function StatsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
