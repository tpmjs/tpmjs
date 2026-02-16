'use client';

import { Badge } from '@tpmjs/ui/Badge/Badge';
import { Button } from '@tpmjs/ui/Button/Button';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import Link from 'next/link';

interface WorkflowToolbarProps {
  name: string;
  status: string;
  saveStatus: 'saved' | 'saving' | 'unsaved' | 'error';
  isRunning: boolean;
  activeTab: 'canvas' | 'runs';
  onRun: () => void;
  onTabChange: (tab: 'canvas' | 'runs') => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}

const STATUS_COLORS: Record<string, 'default' | 'secondary' | 'outline'> = {
  DRAFT: 'outline',
  ACTIVE: 'default',
  ARCHIVED: 'secondary',
};

export function WorkflowToolbar({
  name,
  status,
  saveStatus,
  isRunning,
  activeTab,
  onRun,
  onTabChange,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}: WorkflowToolbarProps): React.ReactElement {
  return (
    <div className="h-12 border-b border-border bg-surface px-4 flex items-center justify-between gap-4">
      {/* Left section */}
      <div className="flex items-center gap-3 min-w-0">
        <Link
          href="/dashboard/workflows"
          className="text-foreground-secondary hover:text-foreground transition-colors flex-shrink-0"
        >
          <Icon icon="arrowLeft" size="sm" />
        </Link>
        <h2 className="text-sm font-medium text-foreground truncate">{name}</h2>
        <Badge variant={STATUS_COLORS[status] || 'outline'} size="sm">
          {status.charAt(0) + status.slice(1).toLowerCase()}
        </Badge>
        <SaveIndicator status={saveStatus} />
      </div>

      {/* Center - Tabs */}
      <div className="flex items-center gap-1 bg-surface-secondary rounded-lg p-0.5">
        <button
          type="button"
          onClick={() => onTabChange('canvas')}
          className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
            activeTab === 'canvas'
              ? 'bg-surface text-foreground shadow-sm'
              : 'text-foreground-secondary hover:text-foreground'
          }`}
        >
          Canvas
        </button>
        <button
          type="button"
          onClick={() => onTabChange('runs')}
          className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
            activeTab === 'runs'
              ? 'bg-surface text-foreground shadow-sm'
              : 'text-foreground-secondary hover:text-foreground'
          }`}
        >
          Runs
        </button>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-2">
        {onUndo && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
          >
            <Icon icon="arrowLeft" size="xs" />
          </Button>
        )}
        {onRedo && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo (Ctrl+Shift+Z)"
          >
            <Icon icon="arrowRight" size="xs" />
          </Button>
        )}
        <Button onClick={onRun} disabled={isRunning} size="sm">
          {isRunning ? (
            <>
              <Icon icon="loader" size="xs" className="mr-1 animate-spin" />
              Running...
            </>
          ) : (
            <>
              <Icon icon="send" size="xs" className="mr-1" />
              Run
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

function SaveIndicator({ status }: { status: string }) {
  const labels: Record<string, { text: string; color: string }> = {
    saved: { text: 'Saved', color: 'text-foreground-tertiary' },
    saving: { text: 'Saving...', color: 'text-foreground-secondary' },
    unsaved: { text: 'Unsaved', color: 'text-amber-500' },
    error: { text: 'Save failed', color: 'text-error' },
  };
  const entry = labels[status] || labels.saved;
  const { text, color } = entry!;
  return <span className={`text-[10px] ${color}`}>{text}</span>;
}
