/**
 * Individual Use Case Page
 *
 * SEO-optimized case study page with hero, story, technical proof, and CTA
 */

import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import UseCaseCaseStudy from '~/components/UseCaseCaseStudy';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;

  try {
    const response = await fetch(
      `${process.env.BETTER_AUTH_URL || 'http://localhost:3000'}/api/use-cases/${slug}`,
      {
        cache: 'no-store',
      }
    );

    if (!response.ok) {
      return {
        title: 'Use Case Not Found - TPMJS',
      };
    }

    const { data } = await response.json();

    return {
      title: `${data.marketingTitle} - TPMJS Use Case`,
      description: data.marketingDesc,
      openGraph: {
        title: data.marketingTitle,
        description: data.marketingDesc,
        type: 'article',
      },
    };
  } catch {
    return {
      title: 'Use Case - TPMJS',
    };
  }
}

export default async function UseCasePage({ params }: Props) {
  const { slug } = await params;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  // biome-ignore lint/suspicious/noExplicitAny: API response data typed by component
  let data: any;
  try {
    const response = await fetch(
      `${process.env.BETTER_AUTH_URL || 'http://localhost:3000'}/api/use-cases/${slug}`,
      {
        cache: 'no-store',
      }
    );

    if (!response.ok) {
      notFound();
    }

    const json = await response.json();
    data = json.data;
  } catch {
    notFound();
  }

  return (
    <Suspense fallback={<UseCaseSkeleton />}>
      <UseCaseCaseStudy useCase={data} />
    </Suspense>
  );
}

function UseCaseSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero skeleton */}
      <div className="border-b bg-card/50 backdrop-blur">
        <div className="container mx-auto px-4 py-12">
          <div className="mx-auto max-w-3xl">
            <div className="h-8 w-32 animate-pulse rounded bg-muted" />
            <div className="mt-4 h-12 w-3/4 animate-pulse rounded bg-muted" />
            <div className="mt-4 h-24 w-full animate-pulse rounded bg-muted" />
          </div>
        </div>
      </div>

      {/* Content skeleton */}
      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-3xl space-y-8">
          <div className="h-64 animate-pulse rounded-lg bg-muted" />
          <div className="h-64 animate-pulse rounded-lg bg-muted" />
          <div className="h-64 animate-pulse rounded-lg bg-muted" />
        </div>
      </div>
    </div>
  );
}
