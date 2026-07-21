import { loadInitialCollections } from '~/lib/discovery/server';
import type { PublicCollection } from '~/lib/discovery/types';
import { CollectionsClient } from './CollectionsClient';

export const dynamic = 'force-dynamic';

function collectionUrl(collection: PublicCollection): string {
  return collection.createdBy.username && collection.slug
    ? `https://tpmjs.com/${collection.createdBy.username}/collections/${collection.slug}`
    : `https://tpmjs.com/collections/${collection.id}`;
}

export default async function PublicCollectionsPage(): Promise<React.ReactElement> {
  let initialCollections: PublicCollection[] = [];
  let initialHasMore = false;
  let initialLoadFailed = false;

  try {
    const initial = await loadInitialCollections();
    initialCollections = initial.collections;
    initialHasMore = initial.hasMore;
  } catch (error) {
    initialLoadFailed = true;
    console.error('[Collections] Initial server load failed; client retry enabled:', error);
  }

  const itemList = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'TPMJS Public Collections',
    numberOfItems: initialCollections.length,
    itemListElement: initialCollections.map((collection, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: collectionUrl(collection),
      name: collection.name,
      description: collection.description,
    })),
  };

  return (
    <>
      {initialCollections.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(itemList).replace(/</g, '\\u003c'),
          }}
        />
      )}
      <CollectionsClient
        initialCollections={initialCollections}
        initialHasMore={initialHasMore}
        initialLoadFailed={initialLoadFailed}
      />
    </>
  );
}
