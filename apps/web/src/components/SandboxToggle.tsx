'use client';

import { Badge } from '@tpmjs/ui/Badge/Badge';
import { Switch } from '@tpmjs/ui/Switch/Switch';
import Link from 'next/link';

interface SandboxToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  disabled?: boolean;
}

export function SandboxToggle({
  enabled,
  onChange,
  disabled = false,
}: SandboxToggleProps): React.ReactElement {
  return (
    <div className="flex items-center justify-between p-4 bg-surface-secondary rounded-lg border border-border">
      <div>
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-foreground">Enable Sandbox</p>
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
            Stateful
          </Badge>
        </div>
        <p className="text-xs text-foreground-secondary mt-0.5">
          Gives your agent a persistent workspace with shell, file, and git tools. Commands, files,
          and repos persist across tool calls within each conversation.{' '}
          <Link href="/docs/executors/sandbox" className="text-primary hover:underline">
            Learn more
          </Link>
        </p>
      </div>
      <Switch checked={enabled} onChange={onChange} disabled={disabled} />
    </div>
  );
}
