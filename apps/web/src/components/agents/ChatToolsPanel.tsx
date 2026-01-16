'use client';

import { Button } from '@tpmjs/ui/Button/Button';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import { useCallback, useState } from 'react';

export interface ToolParameter {
  name: string;
  type: string;
  description: string;
  required: boolean;
  default?: unknown;
}

export interface ToolInfo {
  id: string;
  toolId: string;
  tool: {
    id: string;
    name: string;
    description: string | null;
    parameters: ToolParameter[] | null;
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

interface CollectionToolData {
  tools: ToolInfo[];
  loading: boolean;
  error: string | null;
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
  const [expandedCollections, setExpandedCollections] = useState<Set<string>>(new Set());
  const [collectionTools, setCollectionTools] = useState<Record<string, CollectionToolData>>({});

  const fetchCollectionTools = useCallback(async (collectionId: string) => {
    const existingData = collectionTools[collectionId];
    if (existingData?.tools && existingData.tools.length > 0) return;

    setCollectionTools((prev) => ({
      ...prev,
      [collectionId]: { tools: [], loading: true, error: null },
    }));

    try {
      const response = await fetch(`/api/collections/${collectionId}/tools`);
      const data = await response.json();

      if (data.success) {
        // Transform the response to match ToolInfo structure
        const transformedTools: ToolInfo[] = (data.data || []).map(
          (ct: { id: string; toolId: string; tool: ToolInfo['tool'] }) => ({
            id: ct.id,
            toolId: ct.toolId,
            tool: ct.tool,
          })
        );
        setCollectionTools((prev) => ({
          ...prev,
          [collectionId]: { tools: transformedTools, loading: false, error: null },
        }));
      } else {
        setCollectionTools((prev) => ({
          ...prev,
          [collectionId]: { tools: [], loading: false, error: data.error || 'Failed to load' },
        }));
      }
    } catch {
      setCollectionTools((prev) => ({
        ...prev,
        [collectionId]: { tools: [], loading: false, error: 'Failed to load tools' },
      }));
    }
  }, [collectionTools]);

  const toggleCollection = (collectionId: string) => {
    setExpandedCollections((prev) => {
      const next = new Set(prev);
      if (next.has(collectionId)) {
        next.delete(collectionId);
      } else {
        next.add(collectionId);
        // Fetch tools when expanding
        fetchCollectionTools(collectionId);
      }
      return next;
    });
  };

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
              {collections.map((c) => {
                const isExpanded = expandedCollections.has(c.collectionId);
                const toolData = collectionTools[c.collectionId];

                return (
                  <div
                    key={c.id}
                    className="border border-dashed border-border/50 rounded bg-surface-secondary/30 overflow-hidden"
                  >
                    {/* collection header - clickable */}
                    <button
                      type="button"
                      onClick={() => toggleCollection(c.collectionId)}
                      className="w-full p-2 flex items-center gap-2 hover:bg-surface-secondary transition-colors"
                    >
                      <Icon
                        icon="chevronRight"
                        size="xs"
                        className={`text-foreground-tertiary transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                      />
                      <Icon icon="folder" size="xs" className="text-foreground-tertiary" />
                      <span className="font-mono text-xs text-foreground truncate flex-1 text-left">
                        {c.collection.name}
                      </span>
                      <span className="text-[10px] text-foreground-tertiary">
                        {c.collection.toolCount}
                      </span>
                    </button>

                    {/* expanded tools */}
                    {isExpanded && (
                      <div className="border-t border-dashed border-border/50">
                        {toolData?.loading ? (
                          <div className="p-3 flex items-center justify-center gap-2">
                            <Icon icon="loader" size="xs" className="animate-spin text-foreground-tertiary" />
                            <span className="text-xs text-foreground-tertiary">loading...</span>
                          </div>
                        ) : toolData?.error ? (
                          <div className="p-3 text-xs text-error text-center">
                            {toolData.error}
                          </div>
                        ) : toolData?.tools.length === 0 ? (
                          <div className="p-3 text-xs text-foreground-tertiary text-center">
                            no tools in collection
                          </div>
                        ) : (
                          <div className="p-2 space-y-1 max-h-64 overflow-y-auto">
                            {toolData?.tools.map((t) => (
                              <button
                                key={t.id}
                                type="button"
                                onClick={() => onToolClick(t)}
                                className="w-full text-left p-2 rounded hover:bg-primary/5 border border-transparent hover:border-primary/20 transition-colors group"
                              >
                                <div className="flex items-start gap-2">
                                  <div className="w-1.5 h-1.5 rounded-full bg-primary/50 mt-1.5 flex-shrink-0" />
                                  <div className="min-w-0 flex-1">
                                    <p className="font-mono text-xs text-foreground truncate group-hover:text-primary transition-colors">
                                      {t.tool.name}
                                    </p>
                                    {t.tool.description && (
                                      <p className="text-[10px] text-foreground-tertiary mt-0.5 line-clamp-1">
                                        {t.tool.description}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
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
