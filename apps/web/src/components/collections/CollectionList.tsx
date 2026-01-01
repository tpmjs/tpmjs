'use client';

import { Icon } from '@tpmjs/ui/Icon/Icon';
import { CollectionCard } from './CollectionCard';

interface Collection {
  id: string;
  name: string;
  description: string | null;
  toolCount: number;
  isPublic: boolean;
  updatedAt: Date | string;
}

interface CollectionListProps {
  collections: Collection[];
  onDelete?: (id: string) => void;
  deletingId?: string | null;
}

export function CollectionList({
  collections,
  onDelete,
  deletingId,
}: CollectionListProps): React.ReactElement {
  if (collections.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-surface-secondary flex items-center justify-center mb-4">
          <Icon icon="folder" size="lg" className="text-foreground-tertiary" />
        </div>
        <h3 className="text-lg font-medium text-foreground mb-2">No collections yet</h3>
        <p className="text-foreground-secondary max-w-sm">
          Create your first collection to organize and share your favorite tools.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {collections.map((collection) => (
        <CollectionCard
          key={collection.id}
          collection={collection}
          onDelete={onDelete}
          isDeleting={deletingId === collection.id}
        />
      ))}
    </div>
  );
}
