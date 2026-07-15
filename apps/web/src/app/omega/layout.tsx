import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Omega - AI Agent with Sandboxed TPMJS Tools',
  description:
    'Chat with Omega, an AI assistant that can discover and use any tool from the TPMJS registry. Dynamic tool discovery and execution at your fingertips.',
  openGraph: {
    title: 'Omega - AI Agent with Sandboxed TPMJS Tools',
    description:
      'Chat with Omega, an AI assistant that can discover and use any tool from the TPMJS registry.',
    images: [{ url: '/api/og/omega', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/api/og/omega'],
  },
};

export default function OmegaLayout({ children }: { children: React.ReactNode }) {
  return children;
}
