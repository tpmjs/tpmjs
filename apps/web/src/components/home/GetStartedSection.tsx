import { Container } from '@tpmjs/ui/Container/Container';
import Link from 'next/link';
import { CollectionActivationPanel } from '~/components/collections/CollectionActivationPanel';

export interface FeaturedCollectionActivation {
  id: string;
  name: string;
  slug: string;
  username: string;
  toolCount: number;
}

interface GetStartedSectionProps {
  collection: FeaturedCollectionActivation | null;
}

export function GetStartedSection({ collection }: GetStartedSectionProps): React.ReactElement {
  return (
    <section className="border-t border-border bg-surface py-16 sm:py-20">
      <Container size="xl" padding="lg">
        <div className="mb-9 max-w-3xl sm:mb-12">
          <p className="mb-3 font-mono text-sm font-medium text-primary">
            Start with the real thing
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Give Claude Code a tool collection in 60 seconds.
          </h2>
          <p className="mt-4 max-w-[68ch] text-base leading-relaxed text-foreground-secondary sm:text-lg">
            Skip the account setup and configuration wizard. Public collections are already live MCP
            servers, so your first useful action is one terminal command.
          </p>
        </div>

        {collection ? (
          <CollectionActivationPanel
            collectionId={collection.id}
            name={collection.name}
            username={collection.username}
            slug={collection.slug}
            toolCount={collection.toolCount}
            showCollectionLink
          />
        ) : (
          <div className="border-2 border-foreground p-6 sm:p-8">
            <h3 className="text-xl font-semibold text-foreground">Choose a public collection</h3>
            <p className="mt-2 max-w-[65ch] text-foreground-secondary">
              Every public collection has a ready-to-copy MCP command on its detail page.
            </p>
            <Link
              href="/collections"
              className="mt-5 inline-flex h-11 items-center justify-center bg-primary px-8 font-mono text-lg font-medium lowercase text-primary-foreground transition-colors duration-150 hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              Browse public collections
            </Link>
          </div>
        )}

        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-foreground-secondary">
            Want your own mix? Create a collection once, then expose it through MCP, CLI, REST, SDK,
            and Skill surfaces.
          </p>
          <div className="flex shrink-0 gap-3">
            <Link
              href="/collections"
              className="inline-flex h-10 items-center justify-center border border-border bg-transparent px-4 font-mono text-base font-medium lowercase transition-colors duration-150 hover:border-border-strong hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              Browse collections
            </Link>
            <Link
              href="/setup"
              className="inline-flex h-10 items-center justify-center px-4 font-mono text-base font-medium lowercase text-foreground transition-colors duration-150 hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              Build your setup
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
