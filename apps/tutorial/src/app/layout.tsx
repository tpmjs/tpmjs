import type { Metadata } from 'next';
import { Space_Grotesk, Space_Mono } from 'next/font/google';
import './globals.css';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const spaceMono = Space_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'TPMJS Tutorial - Learn How It Works',
  description: 'Interactive tutorial explaining TPMJS - the Tool Package Manager for AI Agents',
  openGraph: {
    title: 'TPMJS Tutorial',
    description: 'Interactive tutorial explaining TPMJS - the Tool Package Manager for AI Agents',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${spaceMono.variable}`}>
      <body className={spaceGrotesk.className}>{children}</body>
    </html>
  );
}
