import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tool Search | TPMJS',
  description:
    'Search and discover AI tools from the TPMJS registry. Browse by category, sort by downloads or recency.',
  openGraph: {
    title: 'Tool Search | TPMJS',
    description:
      'Search and discover AI tools from the TPMJS registry. Browse by category, sort by downloads or recency.',
    images: [{ url: '/api/og/search', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/api/og/search'],
  },
};

export default function ToolSearchLayout({ children }: { children: React.ReactNode }) {
  return children;
}
