import { Icon } from '@tpmjs/ui/Icon/Icon';
import Link from 'next/link';
import { AppFooter } from '../../components/AppFooter';
import { AppHeader } from '../../components/AppHeader';
import { getAllPosts } from '../../data/blog/posts';

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function BlogIndex() {
  const posts = getAllPosts();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader />

      <main className="flex-1">
        <div className="max-w-3xl mx-auto px-4 py-16">
          {/* Header */}
          <div className="mb-16">
            <h1 className="font-mono text-3xl md:text-4xl font-bold text-foreground mb-4 lowercase">
              blog
            </h1>
            <p className="text-lg text-foreground-secondary">
              Thoughts on AI tools, agent infrastructure, and building the registry.
            </p>
          </div>

          {/* Posts */}
          <div className="space-y-1">
            {posts.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="block group -mx-4 px-4 py-6 border-b border-border hover:bg-surface transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h2 className="font-mono text-xl font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                      {post.title}
                    </h2>
                    <p className="text-sm text-foreground-secondary leading-relaxed mb-3">
                      {post.description}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-foreground-tertiary">
                      <span>{post.author}</span>
                      <span>{formatDate(post.date)}</span>
                      <div className="flex gap-2">
                        {post.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 bg-surface border border-border rounded font-mono"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <Icon
                    icon="chevronRight"
                    size="sm"
                    className="text-foreground-tertiary group-hover:text-primary transition-colors mt-1 flex-shrink-0"
                  />
                </div>
              </Link>
            ))}
          </div>

          {posts.length === 0 && (
            <div className="text-center py-16 text-foreground-secondary">
              <p>No posts yet. Check back soon.</p>
            </div>
          )}
        </div>
      </main>

      <AppFooter />
    </div>
  );
}
