'use client';

import { Badge } from '@tpmjs/ui/Badge/Badge';
import { Button } from '@tpmjs/ui/Button/Button';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import { Modal } from '@tpmjs/ui/Modal/Modal';
import Link from 'next/link';

import type { ToolInfo } from './ChatToolsPanel';

interface ToolDetailsModalProps {
  tool: ToolInfo | null;
  open: boolean;
  onClose: () => void;
}

export function ToolDetailsModal({ tool, open, onClose }: ToolDetailsModalProps) {
  if (!tool) return null;

  const toolPageUrl = `/tool/${tool.tool.package.npmPackageName}/${tool.tool.name}`;

  return (
    <Modal open={open} onClose={onClose} size="lg">
      {/* custom header */}
      <div className="flex items-start justify-between p-6 border-b border-dashed border-border">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Icon icon="puzzle" size="sm" className="text-primary" />
          </div>
          <div>
            <h2 className="font-mono text-lg text-foreground">{tool.tool.name}</h2>
            <p className="font-mono text-sm text-foreground-tertiary mt-0.5">
              {tool.tool.package.npmPackageName}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded hover:bg-surface-secondary text-foreground-tertiary hover:text-foreground transition-colors"
        >
          <Icon icon="x" size="sm" />
        </button>
      </div>

      {/* content */}
      <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
        {/* overview fieldset */}
        <fieldset className="border border-dashed border-border p-4">
          <legend className="px-2 font-mono text-xs text-foreground-tertiary lowercase">
            overview
          </legend>
          <div className="space-y-3">
            {tool.tool.description && (
              <p className="text-sm text-foreground-secondary leading-relaxed">
                {tool.tool.description}
              </p>
            )}
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{tool.tool.package.category}</Badge>
            </div>
          </div>
        </fieldset>

        {/* note about parameters */}
        <fieldset className="border border-dashed border-border p-4">
          <legend className="px-2 font-mono text-xs text-foreground-tertiary lowercase">
            parameters
          </legend>
          <p className="text-sm text-foreground-secondary">
            This tool accepts parameters defined in its input schema. View the full tool page for
            detailed parameter documentation and usage examples.
          </p>
        </fieldset>
      </div>

      {/* footer */}
      <div className="flex items-center justify-between p-4 border-t border-dashed border-border bg-surface-secondary/30">
        <p className="text-xs text-foreground-tertiary font-mono">
          id: {tool.tool.id.slice(0, 8)}...
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
          <Link href={toolPageUrl}>
            <Button size="sm">
              <Icon icon="externalLink" size="xs" className="mr-1.5" />
              View Full Details
            </Button>
          </Link>
        </div>
      </div>
    </Modal>
  );
}
