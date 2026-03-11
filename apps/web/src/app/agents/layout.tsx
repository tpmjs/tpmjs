import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Public Agents | TPMJS',
  description:
    'Browse AI agents built on TPMJS. Each agent combines an LLM, custom prompts, and curated tool collections.',
  openGraph: {
    title: 'Public Agents | TPMJS',
    description:
      'Browse AI agents built on TPMJS. Each agent combines an LLM, custom prompts, and curated tool collections.',
    images: [{ url: '/api/og/agents', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/api/og/agents'],
  },
};

export default function AgentsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
