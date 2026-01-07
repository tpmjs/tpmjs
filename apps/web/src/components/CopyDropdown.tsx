'use client';

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
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-1 px-2 py-1 text-xs text-foreground-secondary hover:text-foreground hover:bg-surface rounded transition-colors"
      >
        <Icon icon="copy" size="xs" />
        <span>{buttonLabel}</span>
        <Icon
          icon="chevronDown"
          size="xs"
          className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-56 bg-background border border-border rounded-lg shadow-lg py-1 z-50">
          {options.map((option) => (
            <button
              key={option.label}
              type="button"
              onClick={() => handleCopy(option)}
              className="w-full px-3 py-2 text-left text-sm hover:bg-surface transition-colors"
            >
              <div className="font-medium text-foreground">{option.label}</div>
              {option.description && (
                <div className="text-xs text-foreground-tertiary truncate">
                  {option.description}
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Helper functions to generate copy options for different entity types

export function getCollectionCopyOptions(
  collectionId: string,
  collectionName: string
): CopyOption[] {
  const baseUrl = 'https://tpmjs.com';
  const mcpUrlHttp = `${baseUrl}/mcp/collections/${collectionId}`;
  const mcpUrlSse = `${baseUrl}/mcp/collections/${collectionId}/sse`;

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

export function getAgentCopyOptions(agentUid: string, agentName: string): CopyOption[] {
  const baseUrl = 'https://tpmjs.com';
  const mcpUrl = `${baseUrl}/mcp/agents/${agentUid}`;

  const claudeConfig = JSON.stringify(
    {
      mcpServers: {
        [agentName.toLowerCase().replace(/\s+/g, '-')]: {
          command: 'npx',
          args: ['-y', '@anthropic-ai/mcp-remote', mcpUrl],
        },
      },
    },
    null,
    2
  );

  return [
    { label: 'Agent UID', value: agentUid, description: agentUid },
    { label: 'MCP URL', value: mcpUrl, description: mcpUrl },
    {
      label: 'Claude Config',
      value: claudeConfig,
      description: 'JSON for claude_desktop_config.json',
    },
  ];
}
