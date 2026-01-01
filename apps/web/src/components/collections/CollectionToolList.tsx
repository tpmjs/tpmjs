'use client';

import { Badge } from '@tpmjs/ui/Badge/Badge';
import { Button } from '@tpmjs/ui/Button/Button';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import Link from 'next/link';

interface CollectionTool {
  id: string;
  toolId: string;
  position: number;
  note: string | null;
  addedAt: Date | string;
  tool: {
    id: string;
    name: string;
    description: string;
    package: {
      npmPackageName: string;
      category: string;
    };
  };
}

interface CollectionToolListProps {
  tools: CollectionTool[];
  onRemove?: (toolId: string) => void;
  removingId?: string | null;
  isOwner?: boolean;
}

export function CollectionToolList({
  tools,
  onRemove,
  removingId,
  isOwner = true,
}: CollectionToolListProps): React.ReactElement {
  if (tools.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center border border-dashed border-border rounded-lg">
        <div className="w-12 h-12 rounded-full bg-surface-secondary flex items-center justify-center mb-3">
          <Icon icon="box" size="md" className="text-foreground-tertiary" />
        </div>
        <h4 className="font-medium text-foreground mb-1">No tools added yet</h4>
        <p className="text-sm text-foreground-secondary max-w-xs">
          {isOwner
            ? 'Use the search above to find and add tools to this collection.'
            : 'This collection is empty.'}
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border border border-border rounded-lg overflow-hidden">
      {tools.map((collectionTool) => (
        <div
          key={collectionTool.id}
          className="p-4 bg-background hover:bg-surface-secondary/50 transition-colors group"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Link
                  href={`/tool/${collectionTool.tool.package.npmPackageName}/${collectionTool.tool.name}`}
                  className="font-medium text-foreground hover:underline focus:underline focus:outline-none"
                >
                  {collectionTool.tool.name}
                </Link>
                <Badge variant="secondary" size="sm">
                  {collectionTool.tool.package.category}
                </Badge>
              </div>
              <p className="text-sm text-foreground-secondary line-clamp-2 mb-2">
                {collectionTool.tool.description}
              </p>
              <p className="text-xs text-foreground-tertiary">
                {collectionTool.tool.package.npmPackageName}
              </p>
              {collectionTool.note && (
                <p className="text-sm text-foreground-secondary mt-2 italic">
                  &ldquo;{collectionTool.note}&rdquo;
                </p>
              )}
            </div>
            {isOwner && onRemove && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemove(collectionTool.toolId)}
                disabled={removingId !== null}
                loading={removingId === collectionTool.toolId}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-foreground-secondary hover:text-error"
              >
                <Icon icon="trash" size="sm" />
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
