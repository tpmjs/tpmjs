'use client';

import { Icon } from '@tpmjs/ui/Icon/Icon';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';

interface CopyButtonProps {
  text: string;
  label?: string;
  successMessage?: string;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}

export function CopyButton({
  text,
  label,
  successMessage = 'Copied to clipboard',
  size = 'sm',
  className = '',
}: CopyButtonProps): React.ReactElement {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success(successMessage);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  }, [text, successMessage]);

  const iconSize = size === 'xs' ? 'xs' : size === 'sm' ? 'sm' : 'md';

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`inline-flex items-center gap-1.5 px-2 py-1 text-foreground-secondary hover:text-foreground hover:bg-surface rounded transition-colors ${className}`}
      title={label || 'Copy to clipboard'}
    >
      <Icon icon={copied ? 'check' : 'copy'} size={iconSize} />
      {label && <span className="text-xs">{label}</span>}
    </button>
  );
}
