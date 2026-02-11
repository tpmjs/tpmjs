'use client';

import { Badge } from '@tpmjs/ui/Badge/Badge';
import { Button } from '@tpmjs/ui/Button/Button';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import { Input } from '@tpmjs/ui/Input/Input';
import {
  Table,
  TableBody,
  TableCell,
  TableEmpty,
  TableHead,
  TableHeader,
  TableRow,
} from '@tpmjs/ui/Table/Table';
import { useCallback, useEffect, useState } from 'react';
import { CustomServerToolPicker } from './CustomServerToolPicker';

interface RemoteTool {
  name: string;
  description?: string;
  inputSchema?: Record<string, unknown>;
}

interface CustomServer {
  id: string;
  name: string;
  url: string;
  authType: string | null;
  authHeader: string | null;
  status: string;
  tools: RemoteTool[];
  toolCount: number;
  lastSyncAt: string | null;
  lastSyncError: string | null;
  createdAt: string;
}

interface CustomServerPanelProps {
  collectionId: string;
}

export function CustomServerPanel({ collectionId }: CustomServerPanelProps) {
  const [servers, setServers] = useState<CustomServer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedServerId, setExpandedServerId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [syncingServerId, setSyncingServerId] = useState<string | null>(null);
  const [deletingServerId, setDeletingServerId] = useState<string | null>(null);

  // Add form state
  const [newName, setNewName] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newAuthType, setNewAuthType] = useState<string>('none');
  const [newAuthToken, setNewAuthToken] = useState('');
  const [newAuthHeader, setNewAuthHeader] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const fetchServers = useCallback(async () => {
    try {
      const res = await fetch('/api/custom-mcp-servers');
      const data = await res.json();
      if (data.success) {
        setServers(data.data.servers);
      }
    } catch (err) {
      console.error('Failed to fetch custom MCP servers:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServers();
  }, [fetchServers]);

  const handleAddServer = async () => {
    if (!newName.trim() || !newUrl.trim()) return;

    setIsAdding(true);
    setAddError(null);

    try {
      const body: Record<string, unknown> = {
        name: newName.trim(),
        url: newUrl.trim(),
      };

      if (newAuthType !== 'none') {
        body.authType = newAuthType;
        body.authToken = newAuthToken;
        if (newAuthHeader) body.authHeader = newAuthHeader;
      }

      const res = await fetch('/api/custom-mcp-servers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (data.success) {
        setServers((prev) => [...prev, data.data]);
        setShowAddForm(false);
        setNewName('');
        setNewUrl('');
        setNewAuthType('none');
        setNewAuthToken('');
        setNewAuthHeader('');
      } else {
        setAddError(data.error?.message || 'Failed to add server');
      }
    } catch {
      setAddError('Failed to add server');
    } finally {
      setIsAdding(false);
    }
  };

  const handleSync = async (serverId: string) => {
    setSyncingServerId(serverId);

    try {
      const res = await fetch(`/api/custom-mcp-servers/${serverId}/sync`, {
        method: 'POST',
      });

      const data = await res.json();

      if (data.success) {
        setServers((prev) =>
          prev.map((s) =>
            s.id === serverId
              ? {
                  ...s,
                  status: 'synced',
                  tools: data.data.tools,
                  toolCount: data.data.toolCount,
                  lastSyncAt: data.data.lastSyncAt,
                  lastSyncError: null,
                }
              : s
          )
        );
      } else {
        setServers((prev) =>
          prev.map((s) =>
            s.id === serverId
              ? { ...s, status: 'error', lastSyncError: data.error?.message || 'Sync failed' }
              : s
          )
        );
      }
    } catch {
      setServers((prev) =>
        prev.map((s) =>
          s.id === serverId ? { ...s, status: 'error', lastSyncError: 'Sync failed' } : s
        )
      );
    } finally {
      setSyncingServerId(null);
    }
  };

  const handleDelete = async (serverId: string) => {
    if (
      !confirm('Delete this server? All tools from this server will be removed from collections.')
    )
      return;

    setDeletingServerId(serverId);

    try {
      const res = await fetch(`/api/custom-mcp-servers/${serverId}`, { method: 'DELETE' });
      const data = await res.json();

      if (data.success) {
        setServers((prev) => prev.filter((s) => s.id !== serverId));
        if (expandedServerId === serverId) setExpandedServerId(null);
      }
    } catch (err) {
      console.error('Failed to delete server:', err);
    } finally {
      setDeletingServerId(null);
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'synced':
        return (
          <Badge variant="success" size="sm">
            Synced
          </Badge>
        );
      case 'error':
        return (
          <Badge variant="error" size="sm">
            Error
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" size="sm">
            Pending
          </Badge>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-10 bg-surface-secondary rounded w-48" />
        <div className="h-32 bg-surface-secondary rounded" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-foreground">Remote MCP Servers</h3>
          <p className="text-xs text-foreground-tertiary mt-0.5">
            Connect remote MCP servers and add their tools to this collection.
          </p>
        </div>
        <Button size="sm" onClick={() => setShowAddForm(!showAddForm)}>
          <Icon icon="plus" size="xs" className="mr-1" />
          Add Server
        </Button>
      </div>

      {/* Add Server Form */}
      {showAddForm && (
        <div className="bg-surface border border-border rounded-lg p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="custom-server-name"
                className="block text-xs font-medium text-foreground-secondary mb-1"
              >
                Name
              </label>
              <Input
                id="custom-server-name"
                size="sm"
                placeholder="My MCP Server"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>
            <div>
              <label
                htmlFor="custom-server-url"
                className="block text-xs font-medium text-foreground-secondary mb-1"
              >
                URL
              </label>
              <Input
                id="custom-server-url"
                size="sm"
                placeholder="https://example.com/mcp"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
              />
            </div>
          </div>

          <div>
            <span className="block text-xs font-medium text-foreground-secondary mb-1">
              Authentication
            </span>
            <div className="flex gap-2">
              {(['none', 'bearer', 'header'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setNewAuthType(type)}
                  className={`px-3 py-1 text-xs rounded-md border transition-colors ${
                    newAuthType === type
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-surface border-border text-foreground-secondary hover:border-foreground-tertiary'
                  }`}
                >
                  {type === 'none' ? 'None' : type === 'bearer' ? 'Bearer Token' : 'Custom Header'}
                </button>
              ))}
            </div>
          </div>

          {newAuthType !== 'none' && (
            <div className="grid grid-cols-2 gap-3">
              {newAuthType === 'header' && (
                <div>
                  <label
                    htmlFor="custom-server-auth-header"
                    className="block text-xs font-medium text-foreground-secondary mb-1"
                  >
                    Header Name
                  </label>
                  <Input
                    id="custom-server-auth-header"
                    size="sm"
                    placeholder="X-API-Key"
                    value={newAuthHeader}
                    onChange={(e) => setNewAuthHeader(e.target.value)}
                  />
                </div>
              )}
              <div className={newAuthType === 'bearer' ? 'col-span-2' : ''}>
                <label
                  htmlFor="custom-server-auth-token"
                  className="block text-xs font-medium text-foreground-secondary mb-1"
                >
                  Token
                </label>
                <Input
                  id="custom-server-auth-token"
                  size="sm"
                  type="password"
                  placeholder="Enter token"
                  value={newAuthToken}
                  onChange={(e) => setNewAuthToken(e.target.value)}
                />
              </div>
            </div>
          )}

          {addError && <p className="text-xs text-error">{addError}</p>}

          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setShowAddForm(false);
                setAddError(null);
              }}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleAddServer}
              loading={isAdding}
              disabled={isAdding || !newName.trim() || !newUrl.trim()}
            >
              Add & Discover Tools
            </Button>
          </div>
        </div>
      )}

      {/* Servers List */}
      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Server</TableHead>
              <TableHead>URL</TableHead>
              <TableHead className="w-[80px]">Status</TableHead>
              <TableHead className="w-[80px]">Tools</TableHead>
              <TableHead className="w-[120px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {servers.length === 0 ? (
              <TableEmpty
                colSpan={5}
                icon={
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Icon icon="globe" size="lg" className="text-primary" />
                  </div>
                }
                title="No remote servers"
                description="Add a remote MCP server to discover and use its tools."
              />
            ) : (
              servers.map((server) => (
                <>
                  <TableRow key={server.id}>
                    <TableCell>
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedServerId(expandedServerId === server.id ? null : server.id)
                        }
                        className="flex items-center gap-1.5 font-medium text-foreground hover:text-primary transition-colors"
                      >
                        <Icon
                          icon={expandedServerId === server.id ? 'chevronDown' : 'chevronRight'}
                          size="xs"
                        />
                        {server.name}
                      </button>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-foreground-secondary font-mono truncate block max-w-[300px]">
                        {server.url}
                      </span>
                    </TableCell>
                    <TableCell>{statusBadge(server.status)}</TableCell>
                    <TableCell>
                      <span className="text-sm text-foreground-secondary">{server.toolCount}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSync(server.id)}
                          disabled={syncingServerId === server.id}
                          loading={syncingServerId === server.id}
                          title="Re-sync tools"
                        >
                          <Icon icon="loader" size="xs" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(server.id)}
                          disabled={deletingServerId === server.id}
                          className="text-error hover:text-error hover:bg-error/10"
                        >
                          <Icon icon="trash" size="xs" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>

                  {/* Expanded tool picker */}
                  {expandedServerId === server.id && (
                    <TableRow key={`${server.id}-tools`}>
                      <TableCell colSpan={5} className="bg-surface-secondary/50 p-0">
                        <div className="p-4">
                          {server.lastSyncError && (
                            <div className="mb-3 p-2 bg-error/10 border border-error/20 rounded text-xs text-error">
                              Sync error: {server.lastSyncError}
                            </div>
                          )}
                          <CustomServerToolPicker collectionId={collectionId} server={server} />
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
