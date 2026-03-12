import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Blog | TPMJS',
  description:
    'Thoughts on AI tools, agent infrastructure, and the evolving ecosystem of MCP, CLI, REST, and SDK protocols.',
  openGraph: {
    title: 'TPMJS Blog',
    description: 'Thoughts on AI tools, agent infrastructure, and the evolving ecosystem.',
  },
  twitter: {
    card: 'summary_large_image',
  },
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return children;
}
