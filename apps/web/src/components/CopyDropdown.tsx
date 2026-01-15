'use client';

import { Button } from '@tpmjs/ui/Button/Button';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

interface CopyOption {
  label: string;
  value: string;
  description?: string;
}

interface CopyDropdownProps {
  options: CopyOption[];
  buttonLabel?: string;
  className?: string;
}

export function CopyDropdown({
  options,
  buttonLabel = 'Copy',
  className = '',
}: CopyDropdownProps): React.ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCopy = useCallback(async (option: CopyOption) => {
    try {
      await navigator.clipboard.writeText(option.value);
      toast.success(`${option.label} copied to clipboard`);
      setIsOpen(false);
    } catch {
      toast.error('Failed to copy');
    }
  }, []);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-1 text-xs text-foreground-secondary hover:text-foreground"
      >
        <Icon icon="copy" size="xs" />
        <span>{buttonLabel}</span>
        <Icon
          icon="chevronDown"
          size="xs"
          className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-56 bg-background border border-border rounded-lg shadow-lg py-1 z-50">
          {options.map((option) => (
            <Button
              key={option.label}
              variant="ghost"
              onClick={() => handleCopy(option)}
              className="w-full px-3 py-2 h-auto text-left justify-start hover:bg-surface"
            >
              <div className="flex flex-col items-start">
                <div className="font-medium text-foreground">{option.label}</div>
                {option.description && (
                  <div className="text-xs text-foreground-tertiary truncate max-w-full">
                    {option.description}
                  </div>
                )}
              </div>
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}

// Helper functions to generate copy options for different entity types

export function getCollectionCopyOptions(
  username: string,
  slug: string,
  collectionName: string
): CopyOption[] {
  const baseUrl = 'https://tpmjs.com';
  const mcpUrlHttp = `${baseUrl}/api/mcp/${username}/${slug}/http`;
  const mcpUrlSse = `${baseUrl}/api/mcp/${username}/${slug}/sse`;

  const claudeConfig = JSON.stringify(
    {
      mcpServers: {
        [collectionName.toLowerCase().replace(/\s+/g, '-')]: {
          command: 'npx',
          args: ['-y', '@anthropic-ai/mcp-remote', mcpUrlSse],
        },
      },
    },
    null,
    2
  );

  return [
    { label: 'MCP URL (HTTP)', value: mcpUrlHttp, description: mcpUrlHttp },
    { label: 'MCP URL (SSE)', value: mcpUrlSse, description: mcpUrlSse },
    {
      label: 'Claude Config',
      value: claudeConfig,
      description: 'JSON for claude_desktop_config.json',
    },
  ];
}

export function getAgentCopyOptions(
  username: string,
  agentUid: string,
  agentName: string
): CopyOption[] {
  const baseUrl = 'https://tpmjs.com';
  const mcpUrlHttp = `${baseUrl}/api/mcp/${username}/${agentUid}/http`;
  const mcpUrlSse = `${baseUrl}/api/mcp/${username}/${agentUid}/sse`;

  const claudeConfig = JSON.stringify(
    {
      mcpServers: {
        [agentName.toLowerCase().replace(/\s+/g, '-')]: {
          command: 'npx',
          args: ['-y', '@anthropic-ai/mcp-remote', mcpUrlSse],
        },
      },
    },
    null,
    2
  );

  return [
    { label: 'Agent UID', value: agentUid, description: agentUid },
    { label: 'MCP URL (HTTP)', value: mcpUrlHttp, description: mcpUrlHttp },
    { label: 'MCP URL (SSE)', value: mcpUrlSse, description: mcpUrlSse },
    {
      label: 'Claude Config',
      value: claudeConfig,
      description: 'JSON for claude_desktop_config.json',
    },
  ];
}
