import { Analytics } from '@vercel/analytics/next';
import type { Metadata } from 'next';
import { Space_Grotesk, Space_Mono } from 'next/font/google';
import Script from 'next/script';
import { AppFooter } from '../components/AppFooter';
import { ThemeProvider } from '../components/providers/ThemeProvider';
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
    default: 'TPMJS - Tool Package Manager for AI Agents',
    template: '%s | TPMJS',
  },
  description:
    'Discover and use npm packages as AI agent tools. No config files, automatic discovery, works with any framework.',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: 'any' },
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
  ],
  authors: [{ name: 'TPMJS' }],
  creator: 'TPMJS',
  publisher: 'TPMJS',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://tpmjs.com',
    siteName: 'TPMJS',
    title: 'TPMJS - Tool Package Manager for AI Agents',
    description:
      'Discover and use npm packages as AI agent tools. No config files, automatic discovery, works with any framework.',
    images: [
      {
        url: '/og-image.png',
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
    title: 'TPMJS - Tool Package Manager for AI Agents',
    description:
      'Discover and use npm packages as AI agent tools. No config files, automatic discovery, works with any framework.',
    images: ['/og-image.png'],
  },
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
      'Discover and use npm packages as AI agent tools. No config files, automatic discovery, works with any framework.',
    sameAs: ['https://github.com/tpmjs/tpmjs', 'https://x.com/tpmjs_registry'],
  };

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'TPMJS',
    url: 'https://tpmjs.com',
    description:
      'Discover and use npm packages as AI agent tools. No config files, automatic discovery, works with any framework.',
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
        {process.env.NODE_ENV === 'development' && (
          <>
            <Script
              src="//unpkg.com/react-grab/dist/index.global.js"
              strategy="beforeInteractive"
            />
            <Script
              src="//unpkg.com/@react-grab/claude-code/dist/client.global.js"
              strategy="lazyOnload"
            />
          </>
        )}
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
          <div className="flex flex-col min-h-screen">
            <div className="flex-1">{children}</div>
            <AppFooter />
          </div>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
