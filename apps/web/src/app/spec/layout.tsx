import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'TPMJS Specification',
  description:
    'The open standard for AI tool discovery. Complete schema reference for package.json configuration.',
  openGraph: {
    title: 'TPMJS Specification',
    description:
      'The open standard for AI tool discovery. Complete schema reference for package.json configuration.',
    images: [{ url: '/api/og/spec', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/api/og/spec'],
  },
};

export default function SpecLayout({ children }: { children: React.ReactNode }) {
  return children;
}
