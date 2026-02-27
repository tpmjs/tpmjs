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
 * Full-width env key warning — brutalist pipeline bar
 */
export function EnvVarWarningBanner({ warnings, onDismiss }: EnvVarWarningBannerProps) {
  const router = useRouter();
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed || warnings.length === 0) {
    return null;
  }

  // Group by env var name
  const uniqueEnvVars = Array.from(new Map(warnings.map((w) => [w.envVar.name, w])).values());

  const handleConfigure = () => {
    router.push('/omega/settings');
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  return (
    <div className="border-y border-warning/40 bg-warning/5">
      <div className="px-4 md:px-6 py-3">
        {/* Header row */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-warning animate-pulse" />
            <span className="font-mono text-xs text-warning uppercase tracking-wider font-bold">
              {uniqueEnvVars.length} missing key{uniqueEnvVars.length !== 1 ? 's' : ''}
            </span>
            <div className="h-px bg-warning/30 w-8" />
            <span className="font-mono text-xs text-foreground-tertiary">
              some tools need API keys to run
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={handleConfigure}>
              <Icon icon="key" size="xs" className="mr-1.5" />
              Configure
            </Button>
            <button
              type="button"
              onClick={handleDismiss}
              className="w-7 h-7 flex items-center justify-center text-foreground-tertiary hover:text-foreground transition-colors"
            >
              <Icon icon="x" size="xs" />
            </button>
          </div>
        </div>

        {/* Key list — horizontal on wide, vertical on narrow */}
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {uniqueEnvVars.map((warning) => (
            <div key={warning.envVar.name} className="flex items-center gap-2">
              <code className="font-mono text-xs font-bold text-foreground">
                {warning.envVar.name}
              </code>
              <span className="font-mono text-[10px] text-foreground-tertiary">
                {warning.packageName}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
