export const metadata = {
  title: 'TPMJS Executor',
  description: 'TPMJS Tool Executor using Vercel Sandbox',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
