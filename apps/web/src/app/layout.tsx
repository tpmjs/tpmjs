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
  title: 'TPMJS - Tool Package Manager for AI Agents',
  description:
    'The registry for AI tools. Discover, share, and integrate tools that give your agents superpowers.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
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
      </body>
    </html>
  );
}
