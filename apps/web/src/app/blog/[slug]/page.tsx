import { Button } from '@tpmjs/ui/Button/Button';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AppFooter } from '../../../components/AppFooter';
import { AppHeader } from '../../../components/AppHeader';
import { Markdown } from '../../../components/Markdown';
import { getAllPosts, getPostBySlug } from '../../../data/blog/posts';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) return {};

  return {
    title: `${post.title} | TPMJS Blog`,
    description: post.description,
    authors: [{ name: post.author }],
    openGraph: {
      title: post.title,
      description: post.description,
      type: 'article',
      publishedTime: post.date,
      authors: [post.author],
      tags: post.tags,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description,
    },
  };
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader />

      <main className="flex-1">
        <article className="max-w-3xl mx-auto px-4 py-16">
          {/* Back link */}
          <Link
            href="/blog"
            className="inline-flex items-center gap-1 text-sm text-foreground-tertiary hover:text-foreground transition-colors mb-8"
          >
            <Icon icon="chevronLeft" size="xs" />
            All posts
          </Link>

          {/* Header */}
          <header className="mb-12">
            <h1 className="font-mono text-3xl md:text-4xl font-bold text-foreground mb-4">
              {post.title}
            </h1>
            <p className="text-lg text-foreground-secondary mb-6">{post.description}</p>
            <div className="flex items-center gap-4 text-sm text-foreground-tertiary border-b border-border pb-6">
              <span className="font-medium text-foreground-secondary">{post.author}</span>
              <span>{formatDate(post.date)}</span>
              <div className="flex gap-2">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 bg-surface border border-border rounded font-mono text-xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </header>

          {/* Content */}
          <Markdown content={post.content} />

          {/* Footer CTA */}
          <div className="mt-16 p-8 border border-dashed border-border bg-surface text-center">
            <h3 className="font-mono text-lg font-semibold text-foreground mb-2 lowercase">
              try tpmjs
            </h3>
            <p className="text-sm text-foreground-secondary mb-4">
              Install the CLI and start discovering AI tools in your terminal.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Link href="/docs/quickstart">
                <Button size="md">Get started</Button>
              </Link>
              <a href="https://github.com/tpmjs/tpmjs" target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="md">
                  <Icon icon="github" size="sm" />
                  GitHub
                </Button>
              </a>
            </div>
          </div>
        </article>
      </main>

      <AppFooter />
    </div>
  );
}
