import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'TPMJS - Tool Package Manager for AI Agents',
  description: 'The registry for AI tools. Discover, share, and integrate tools that give your agents superpowers.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
