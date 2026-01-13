'use client';

import { Badge } from '@tpmjs/ui/Badge/Badge';
import { Button } from '@tpmjs/ui/Button/Button';
import { Icon } from '@tpmjs/ui/Icon/Icon';
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
import { DashboardLayout } from '~/components/dashboard/DashboardLayout';

interface BridgeServer {
  id: string;
  name: string;
  toolCount: number;
  tools: string[];
}

interface BridgeStatus {
  status: 'connected' | 'disconnected' | 'stale' | 'never_connected';
  lastSeen: string | null;
  clientVersion: string | null;
  clientOS: string | null;
  toolCount: number;
  servers: BridgeServer[];
}

function getStatusBadge(status: BridgeStatus['status']) {
  switch (status) {
    case 'connected':
      return <Badge variant="success">Connected</Badge>;
    case 'stale':
      return <Badge variant="warning">Stale</Badge>;
    case 'disconnected':
      return <Badge variant="secondary">Disconnected</Badge>;
    case 'never_connected':
      return <Badge variant="secondary">Never Connected</Badge>;
  }
}

function formatLastSeen(lastSeen: string | null): string {
  if (!lastSeen) return 'Never';
  const date = new Date(lastSeen);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);

  if (diffSecs < 60) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  return date.toLocaleDateString();
}

export default function BridgePage(): React.ReactElement {
  const [bridgeStatus, setBridgeStatus] = useState<BridgeStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/user/bridge');
      const data = await response.json();
      if (data.success) {
        setBridgeStatus(data.data);
      } else {
        setError(data.error || 'Failed to fetch bridge status');
      }
    } catch (err) {
      console.error('Failed to fetch bridge status:', err);
      setError('Failed to fetch bridge status');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    // Refresh every 10 seconds
    const interval = setInterval(fetchStatus, 10000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  if (error) {
    return (
      <DashboardLayout title="Bridge">
        <div className="text-center py-16">
          <Icon icon="alertCircle" size="lg" className="mx-auto text-error mb-4" />
          <h2 className="text-lg font-medium text-foreground mb-2">Error</h2>
          <p className="text-foreground-secondary mb-4">{error}</p>
          <Button onClick={fetchStatus}>Try Again</Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Bridge"
      subtitle="Connect local MCP servers to TPMJS"
      actions={
        <Button variant="outline" size="sm" onClick={fetchStatus}>
          <Icon icon="loader" size="sm" className="mr-2" />
          Refresh
        </Button>
      }
    >
      {/* Status Card */}
      <div className="bg-surface border border-border rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-foreground">Connection Status</h2>
          {!isLoading && bridgeStatus && getStatusBadge(bridgeStatus.status)}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            <div className="h-4 w-48 bg-surface-secondary rounded animate-pulse" />
            <div className="h-4 w-32 bg-surface-secondary rounded animate-pulse" />
          </div>
        ) : bridgeStatus?.status === 'never_connected' ? (
          <div className="space-y-4">
            <p className="text-foreground-secondary">
              The TPMJS Bridge allows you to connect local MCP servers (like Chrome DevTools, file
              systems, or custom tools) to your TPMJS collections.
            </p>
            <div className="bg-surface-secondary rounded-lg p-4">
              <h3 className="text-sm font-medium text-foreground mb-2">Quick Start</h3>
              <ol className="space-y-2 text-sm text-foreground-secondary">
                <li>
                  1. Install the bridge CLI:{' '}
                  <code className="px-1.5 py-0.5 bg-surface rounded text-xs font-mono">
                    npm install -g @tpmjs/bridge
                  </code>
                </li>
                <li>
                  2. Initialize:{' '}
                  <code className="px-1.5 py-0.5 bg-surface rounded text-xs font-mono">
                    tpmjs-bridge init
                  </code>
                </li>
                <li>
                  3. Add an MCP server:{' '}
                  <code className="px-1.5 py-0.5 bg-surface rounded text-xs font-mono">
                    tpmjs-bridge add chrome-devtools
                  </code>
                </li>
                <li>
                  4. Start the bridge:{' '}
                  <code className="px-1.5 py-0.5 bg-surface rounded text-xs font-mono">
                    tpmjs-bridge start
                  </code>
                </li>
              </ol>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-foreground-tertiary">Last Seen:</span>
                <span className="ml-2 text-foreground">
                  {formatLastSeen(bridgeStatus?.lastSeen ?? null)}
                </span>
              </div>
              <div>
                <span className="text-foreground-tertiary">Tools:</span>
                <span className="ml-2 text-foreground">{bridgeStatus?.toolCount ?? 0}</span>
              </div>
              {bridgeStatus?.clientVersion && (
                <div>
                  <span className="text-foreground-tertiary">Version:</span>
                  <span className="ml-2 text-foreground">{bridgeStatus.clientVersion}</span>
                </div>
              )}
              {bridgeStatus?.clientOS && (
                <div>
                  <span className="text-foreground-tertiary">Platform:</span>
                  <span className="ml-2 text-foreground">{bridgeStatus.clientOS}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Connected Servers Table */}
      {!isLoading && bridgeStatus && bridgeStatus.servers && bridgeStatus.servers.length > 0 && (
        <div className="bg-surface border border-border rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="text-lg font-medium text-foreground">Connected MCP Servers</h2>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Server</TableHead>
                <TableHead className="w-[100px]">Tools</TableHead>
                <TableHead>Available Tools</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bridgeStatus.servers.map((server) => (
                <TableRow key={server.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Icon icon="terminal" size="sm" className="text-primary" />
                      </div>
                      <span className="font-medium text-foreground">{server.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{server.toolCount}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {server.tools.slice(0, 5).map((tool) => (
                        <span
                          key={tool}
                          className="px-2 py-0.5 text-xs bg-surface-secondary rounded text-foreground-secondary"
                        >
                          {tool}
                        </span>
                      ))}
                      {server.tools.length > 5 && (
                        <span className="px-2 py-0.5 text-xs bg-surface-secondary rounded text-foreground-tertiary">
                          +{server.tools.length - 5} more
                        </span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Empty State for no servers */}
      {!isLoading &&
        bridgeStatus &&
        bridgeStatus.status !== 'never_connected' &&
        (!bridgeStatus.servers || bridgeStatus.servers.length === 0) && (
          <div className="bg-surface border border-border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Connected MCP Servers</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableEmpty
                  colSpan={1}
                  icon={
                    <div className="w-16 h-16 rounded-full bg-warning/10 flex items-center justify-center">
                      <Icon icon="alertCircle" size="lg" className="text-warning" />
                    </div>
                  }
                  title="No MCP servers connected"
                  description="Your bridge is running but no MCP servers are configured. Add a server to make its tools available."
                />
              </TableBody>
            </Table>
          </div>
        )}

      {/* Help Section */}
      <div className="mt-6 text-sm text-foreground-tertiary">
        <p>
          Bridge tools can be added to your collections and used in agents. When the bridge is
          connected, the tools will be available for execution through your local MCP servers.
        </p>
      </div>
    </DashboardLayout>
  );
}
