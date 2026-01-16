'use client';

import { Button } from '@tpmjs/ui/Button/Button';
import { Icon } from '@tpmjs/ui/Icon/Icon';

export interface ToolInfo {
  id: string;
  toolId: string;
  tool: {
    id: string;
    name: string;
    description: string | null;
    package: {
      npmPackageName: string;
      category: string;
    };
  };
}

export interface CollectionInfo {
  id: string;
  collectionId: string;
  collection: {
    id: string;
    name: string;
    toolCount: number;
  };
}

interface ChatToolsPanelProps {
  tools: ToolInfo[];
  collections: CollectionInfo[];
  isOpen: boolean;
  onClose: () => void;
  onToolClick: (tool: ToolInfo) => void;
}

export function ChatToolsPanel({
  tools,
  collections,
  isOpen,
  onClose,
  onToolClick,
}: ChatToolsPanelProps) {
  if (!isOpen) return null;

  const totalToolsFromCollections = collections.reduce(
    (acc, c) => acc + c.collection.toolCount,
    0
  );

  return (
    <div className="w-72 border-l border-dashed border-border flex flex-col bg-surface">
      {/* header */}
      <div className="flex items-center justify-between p-4 border-b border-dashed border-border">
        <span className="font-mono text-sm text-foreground-secondary lowercase">
          available tools
        </span>
        <Button variant="ghost" size="sm" onClick={onClose} className="h-7 w-7 p-0">
          <Icon icon="x" size="xs" />
        </Button>
      </div>

      {/* tools list */}
      <div className="flex-1 overflow-y-auto">
        {/* direct tools */}
        {tools.length > 0 && (
          <fieldset className="m-3 border border-dashed border-border">
            <legend className="px-2 font-mono text-xs text-foreground-tertiary lowercase">
              direct tools ({tools.length})
            </legend>
            <div className="p-2 space-y-1">
              {tools.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onToolClick(t)}
                  className="w-full text-left p-2 rounded hover:bg-primary/5 hover:border-primary/20 border border-transparent transition-colors group"
                >
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-sm text-foreground truncate group-hover:text-primary transition-colors">
                        {t.tool.name}
                      </p>
                      <p className="font-mono text-xs text-foreground-tertiary truncate">
                        {t.tool.package.npmPackageName}
                      </p>
                      {t.tool.description && (
                        <p className="text-xs text-foreground-secondary mt-0.5 line-clamp-2">
                          {t.tool.description}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </fieldset>
        )}

        {/* collections */}
        {collections.length > 0 && (
          <fieldset className="m-3 border border-dashed border-border">
            <legend className="px-2 font-mono text-xs text-foreground-tertiary lowercase">
              from collections ({totalToolsFromCollections})
            </legend>
            <div className="p-2 space-y-2">
              {collections.map((c) => (
                <div
                  key={c.id}
                  className="p-2 border border-dashed border-border/50 rounded bg-surface-secondary/30"
                >
                  <div className="flex items-center gap-2">
                    <Icon icon="folder" size="xs" className="text-foreground-tertiary" />
                    <span className="font-mono text-xs text-foreground truncate">
                      {c.collection.name}
                    </span>
                  </div>
                  <p className="text-xs text-foreground-tertiary mt-1 pl-5">
                    {c.collection.toolCount} tools
                  </p>
                </div>
              ))}
            </div>
          </fieldset>
        )}

        {/* empty state */}
        {tools.length === 0 && collections.length === 0 && (
          <div className="p-6 text-center">
            <div className="w-10 h-10 rounded-full bg-surface-secondary flex items-center justify-center mx-auto mb-3">
              <Icon icon="puzzle" size="sm" className="text-foreground-tertiary" />
            </div>
            <p className="text-sm text-foreground-secondary">No tools attached</p>
            <p className="text-xs text-foreground-tertiary mt-1">
              Add tools from the agent settings
            </p>
          </div>
        )}
      </div>

      {/* footer stats */}
      <div className="p-3 border-t border-dashed border-border bg-surface-secondary/30">
        <div className="flex items-center justify-between text-xs">
          <span className="text-foreground-tertiary font-mono">
            {tools.length} direct + {totalToolsFromCollections} from collections
          </span>
        </div>
      </div>
    </div>
  );
}
