import { Analytics } from '@vercel/analytics/next';
import { DontoAnalytics } from '../components/DontoAnalytics';
import type { Metadata } from 'next';
import { Space_Grotesk, Space_Mono } from 'next/font/google';
import { Toaster } from 'sonner';
import { AppFooter } from '../components/AppFooter';
import { ThemeProvider } from '../components/providers/ThemeProvider';
import { SWRProvider } from '../components/SWRProvider';
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
  metadataBase: new URL('https://tpmjs.com'),
  title: {
    default: 'TPMJS - Curated, Sandboxed AI Agent Tools over MCP',
    template: '%s | TPMJS',
  },
  description:
    'Open-source registry and execution platform for AI agent tools. tpmjs auto-discovers tools published to npm, scores each for quality and health, runs them in an isolated hosted sandbox, and serves curated collections to Claude Code, Cursor, ChatGPT, and any MCP client through a single URL.',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.png', type: 'image/png', sizes: '32x32' },
    ],
    apple: '/apple-touch-icon.svg',
  },
  keywords: [
    'AI tools',
    'AI agents',
    'tool registry',
    'TPMJS',
    'agent tools',
    'AI SDK',
    'Vercel AI',
    'Claude',
    'OpenAI',
    'npm tools',
    'MCP',
    'Model Context Protocol',
    'tool registry',
  ],
  authors: [{ name: 'TPMJS' }],
  creator: 'TPMJS',
  publisher: 'TPMJS',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://tpmjs.com',
    siteName: 'TPMJS',
    title: 'TPMJS - Curated, Sandboxed AI Agent Tools over MCP',
    description:
      'Open-source registry and execution platform for AI agent tools. Auto-discovers npm-published tools, scores quality and health, runs them in an isolated hosted sandbox, and serves curated collections to Claude Code, Cursor, ChatGPT, and any MCP client through one URL.',
    images: [
      {
        url: '/api/og/home',
        width: 1200,
        height: 630,
        alt: 'TPMJS - Tool Package Manager for AI Agents',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@tpmjs_registry',
    creator: '@tpmjs_registry',
    title: 'TPMJS - Curated, Sandboxed AI Agent Tools over MCP',
    description:
      'The npm for AI tools — curated, scored, and sandboxed. Auto-discovers npm-published tools, scores quality and health, runs them in an isolated sandbox, and serves curated collections to Claude Code, Cursor, ChatGPT, and any MCP client.',
    images: ['/api/og/home'],
  },
  manifest: '/manifest.json',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'TPMJS',
    url: 'https://tpmjs.com',
    logo: 'https://tpmjs.com/logo.png',
    description:
      'Open-source registry for AI agent tools. Auto-discovers npm packages, extracts schemas, scores quality, and serves tools to Claude Code, Cursor, Windsurf, and any MCP client.',
    sameAs: ['https://github.com/tpmjs/tpmjs', 'https://x.com/tpmjs_registry'],
  };

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'TPMJS',
    url: 'https://tpmjs.com',
    description:
      'Open-source registry for AI agent tools. Auto-discovers npm packages, extracts schemas, scores quality, and serves tools to Claude Code, Cursor, Windsurf, and any MCP client.',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://tpmjs.com/tool/tool-search?q={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${spaceGrotesk.variable} ${spaceMono.variable}`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
      </head>
      <body className={spaceGrotesk.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={true}
          disableTransitionOnChange={false}
        >
          <SWRProvider>
            <div className="flex flex-col min-h-screen">
              <div className="flex-1">{children}</div>
              <AppFooter />
            </div>
            <Toaster position="bottom-right" richColors closeButton />
          </SWRProvider>
        </ThemeProvider>
        <Analytics />
        <DontoAnalytics />
      </body>
    </html>
  );
}
