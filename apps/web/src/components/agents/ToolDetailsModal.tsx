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
  const parameters = tool.tool.parameters || [];
  const requiredParams = parameters.filter((p) => p.required);
  const optionalParams = parameters.filter((p) => !p.required);

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
              {parameters.length > 0 && (
                <Badge variant="outline">
                  {parameters.length} param{parameters.length !== 1 ? 's' : ''}
                </Badge>
              )}
            </div>
          </div>
        </fieldset>

        {/* parameters fieldset */}
        <fieldset className="border border-dashed border-border p-4">
          <legend className="px-2 font-mono text-xs text-foreground-tertiary lowercase">
            parameters
          </legend>

          {parameters.length === 0 ? (
            <p className="text-sm text-foreground-tertiary italic">No parameters defined</p>
          ) : (
            <div className="space-y-4">
              {/* Required parameters */}
              {requiredParams.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 rounded-full bg-error" />
                    <span className="font-mono text-xs text-foreground-secondary uppercase tracking-wide">
                      Required ({requiredParams.length})
                    </span>
                  </div>
                  <div className="space-y-3">
                    {requiredParams.map((param) => (
                      <ParameterRow key={param.name} param={param} />
                    ))}
                  </div>
                </div>
              )}

              {/* Optional parameters */}
              {optionalParams.length > 0 && (
                <div className={requiredParams.length > 0 ? 'pt-4 border-t border-dashed border-border/50' : ''}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 rounded-full bg-foreground-tertiary" />
                    <span className="font-mono text-xs text-foreground-secondary uppercase tracking-wide">
                      Optional ({optionalParams.length})
                    </span>
                  </div>
                  <div className="space-y-3">
                    {optionalParams.map((param) => (
                      <ParameterRow key={param.name} param={param} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
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

interface ParameterRowProps {
  param: {
    name: string;
    type: string;
    description: string;
    required: boolean;
    default?: unknown;
  };
}

function ParameterRow({ param }: ParameterRowProps) {
  return (
    <div className="group p-3 rounded-lg bg-surface-secondary/30 hover:bg-surface-secondary/50 transition-colors">
      <div className="flex items-start justify-between gap-3 mb-1.5">
        <code className="font-mono text-sm text-foreground font-medium">{param.name}</code>
        <code className="font-mono text-xs px-1.5 py-0.5 rounded bg-surface-secondary text-foreground-secondary">
          {param.type}
        </code>
      </div>
      {param.description && (
        <p className="text-sm text-foreground-secondary leading-relaxed">{param.description}</p>
      )}
      {param.default !== undefined && (
        <div className="mt-2 flex items-center gap-2">
          <span className="text-xs text-foreground-tertiary">default:</span>
          <code className="font-mono text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary">
            {JSON.stringify(param.default)}
          </code>
        </div>
      )}
    </div>
  );
}
