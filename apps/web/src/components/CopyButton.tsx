'use client';

import { Button } from '@tpmjs/ui/Button/Button';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

interface CopyButtonProps {
  text: string;
  label?: string;
  successMessage?: string;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
  onCopy?: () => void;
}

export function CopyButton({
  text,
  label,
  successMessage = 'Copied to clipboard',
  size = 'sm',
  className = '',
  onCopy,
}: CopyButtonProps): React.ReactElement {
  const [copied, setCopied] = useState(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (resetTimer.current) clearTimeout(resetTimer.current);
    },
    []
  );

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success(successMessage);
      try {
        onCopy?.();
      } catch {
        // Follow-up observers must never turn a successful copy into a UI failure.
      }
      if (resetTimer.current) clearTimeout(resetTimer.current);
      resetTimer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  }, [text, successMessage, onCopy]);

  const iconSize = size === 'xs' ? 'xs' : size === 'sm' ? 'sm' : 'md';
  // Map xs to sm for Button since Button doesn't support xs size
  const buttonSize = size === 'xs' ? 'sm' : size;

  return (
    <Button
      variant="ghost"
      size={buttonSize}
      onClick={handleCopy}
      className={`inline-flex items-center gap-1.5 text-foreground-secondary hover:text-foreground ${className}`}
      title={label || 'Copy to clipboard'}
      aria-label={label || 'Copy to clipboard'}
    >
      <Icon icon={copied ? 'check' : 'copy'} size={iconSize} />
      {label && <span className={size === 'md' ? 'text-sm' : 'text-xs'}>{label}</span>}
    </Button>
  );
}
