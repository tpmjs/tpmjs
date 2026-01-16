import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Platform Guide | TPMJS Docs',
  description:
    'Complete guide to TPMJS platform features: user accounts, collections, agents, forking, and API keys. Learn how to organize tools, create AI agents, and share your work.',
  openGraph: {
    title: 'TPMJS Platform Guide',
    description:
      'Complete guide to user accounts, collections, agents, forking, and API keys on TPMJS.',
    images: [{ url: '/api/og/docs', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/api/og/docs'],
  },
};

export default function PlatformGuideLayout({ children }: { children: React.ReactNode }) {
  return children;
}
