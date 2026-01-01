'use client';

import { Badge } from '@tpmjs/ui/Badge/Badge';
import { Button } from '@tpmjs/ui/Button/Button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@tpmjs/ui/Card/Card';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import Link from 'next/link';

interface CollectionCardProps {
  collection: {
    id: string;
    name: string;
    description: string | null;
    toolCount: number;
    isPublic: boolean;
    updatedAt: Date | string;
  };
  onDelete?: (id: string) => void;
  isDeleting?: boolean;
}

export function CollectionCard({
  collection,
  onDelete,
  isDeleting,
}: CollectionCardProps): React.ReactElement {
  const updatedDate = new Date(collection.updatedAt);

  return (
    <Card variant="default" className="hover:border-foreground/20 transition-colors group">
      <CardHeader padding="md">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <CardTitle as="h3" className="truncate">
              <Link
                href={`/dashboard/collections/${collection.id}`}
                className="hover:underline focus:underline focus:outline-none"
              >
                {collection.name}
              </Link>
            </CardTitle>
            {collection.description && (
              <CardDescription className="line-clamp-2 mt-1">
                {collection.description}
              </CardDescription>
            )}
          </div>
          {collection.isPublic && (
            <Badge variant="secondary" size="sm" className="flex-shrink-0">
              <Icon icon="globe" size="sm" className="mr-1" />
              Public
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent padding="md" className="pt-0">
        <div className="flex items-center gap-2 text-sm text-foreground-secondary">
          <Icon icon="box" size="sm" />
          <span>
            {collection.toolCount} {collection.toolCount === 1 ? 'tool' : 'tools'}
          </span>
        </div>
      </CardContent>

      <CardFooter
        padding="md"
        className="flex justify-between items-center border-t border-border pt-3"
      >
        <span className="text-xs text-foreground-tertiary">
          Updated {updatedDate.toLocaleDateString()}
        </span>
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Link href={`/dashboard/collections/${collection.id}`}>
            <Button variant="ghost" size="sm">
              <Icon icon="edit" size="sm" className="mr-1" />
              Edit
            </Button>
          </Link>
          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(collection.id)}
              disabled={isDeleting}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Icon icon="trash" size="sm" className="mr-1" />
              Delete
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
