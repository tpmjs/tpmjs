import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Documentation | TPMJS',
  description:
    'Complete documentation for TPMJS - the registry for AI tools. Learn how to use the SDK, API, and publish your own tools.',
  openGraph: {
    title: 'TPMJS Documentation',
    description:
      'Complete documentation for TPMJS - the registry for AI tools. Learn how to use the SDK, API, and publish your own tools.',
  },
};

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
