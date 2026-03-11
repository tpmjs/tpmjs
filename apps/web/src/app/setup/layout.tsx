import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Setup | TPMJS',
  description:
    'Connect TPMJS tools to your editor in one command. Supports Claude Code, Cursor, Windsurf, and other MCP-compatible clients.',
  openGraph: {
    title: 'Setup | TPMJS',
    description:
      'Connect TPMJS tools to your editor in one command. Supports Claude Code, Cursor, Windsurf, and other MCP-compatible clients.',
    images: [{ url: '/api/og/setup', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/api/og/setup'],
  },
};

export default function SetupLayout({ children }: { children: React.ReactNode }) {
  return children;
}
