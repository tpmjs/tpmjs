'use client';

import { Button } from '@tpmjs/ui/Button/Button';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface EnvVarWarning {
  toolId: string;
  toolName: string;
  packageName: string;
  envVar: {
    name: string;
    description: string;
    required: boolean;
  };
}

interface EnvVarWarningBannerProps {
  warnings: EnvVarWarning[];
  onDismiss?: () => void;
}

/**
 * Inline env key warning bar
 */
export function EnvVarWarningBanner({ warnings, onDismiss }: EnvVarWarningBannerProps) {
  const router = useRouter();
  const [isDismissed, setIsDismissed] = useState(false);
  const [expanded, setExpanded] = useState(false);

  if (isDismissed || warnings.length === 0) {
    return null;
  }

  const uniqueEnvVars = Array.from(new Map(warnings.map((w) => [w.envVar.name, w])).values());

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  return (
    <div className="border-t border-warning/30 bg-warning/5">
      {/* Collapsed bar */}
      <div className="flex items-center gap-3 px-4 md:px-6 py-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Icon icon="key" size="xs" className="text-warning flex-shrink-0" />
          <span className="text-xs text-foreground-secondary truncate">
            {uniqueEnvVars.length === 1 && uniqueEnvVars[0] ? (
              <>
                <code className="font-mono font-bold text-foreground">
                  {uniqueEnvVars[0].envVar.name}
                </code>{' '}
                needed for {uniqueEnvVars[0].packageName}
              </>
            ) : (
              <>
                <span className="font-bold text-foreground">{uniqueEnvVars.length} API keys</span>{' '}
                needed for discovered tools
              </>
            )}
          </span>
          {uniqueEnvVars.length > 1 && (
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="text-[10px] font-mono text-foreground-tertiary hover:text-foreground transition-colors flex-shrink-0"
            >
              {expanded ? 'hide' : 'show'}
            </button>
          )}
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <Button size="sm" onClick={() => router.push('/omega/settings')}>
            <Icon icon="key" size="xs" className="mr-1.5" />
            Configure
          </Button>
          <button
            type="button"
            onClick={handleDismiss}
            className="p-1 text-foreground-tertiary hover:text-foreground transition-colors"
          >
            <Icon icon="x" size="xs" />
          </button>
        </div>
      </div>

      {/* Expanded key list */}
      {expanded && uniqueEnvVars.length > 1 && (
        <div className="px-4 md:px-6 pb-2 flex flex-wrap gap-x-4 gap-y-1">
          {uniqueEnvVars.map((w) => (
            <div key={w.envVar.name} className="flex items-center gap-1.5">
              <code className="font-mono text-[11px] font-bold text-foreground">
                {w.envVar.name}
              </code>
              <span className="font-mono text-[10px] text-foreground-tertiary">
                {w.packageName}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
