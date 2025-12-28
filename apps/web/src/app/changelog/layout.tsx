import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Changelog | TPMJS',
  description:
    'Release history for all published TPMJS packages. Track new features, improvements, and bug fixes across our SDK and tools.',
  openGraph: {
    title: 'TPMJS Changelog',
    description:
      'Release history for all published TPMJS packages. Track new features, improvements, and bug fixes across our SDK and tools.',
    images: [{ url: '/api/og/changelog', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/api/og/changelog'],
  },
};

export default function ChangelogLayout({ children }: { children: React.ReactNode }) {
  return children;
}
