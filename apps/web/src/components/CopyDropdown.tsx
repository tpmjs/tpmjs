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
        <div className="absolute right-0 top-full mt-1 min-w-[280px] bg-background border border-border rounded-lg shadow-lg py-1 z-50">
          {options.map((option) => (
            <button
              type="button"
              key={option.label}
              onClick={() => handleCopy(option)}
              className="w-full px-3 py-2 text-left hover:bg-surface-secondary transition-colors"
            >
              <div className="font-mono text-xs font-medium text-foreground lowercase">
                {option.label}
              </div>
              {option.description && (
                <div className="text-[10px] text-foreground-tertiary font-mono mt-0.5 truncate">
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
  _agentName: string
): CopyOption[] {
  const baseUrl = 'https://tpmjs.com';
  // Generate a random conversation ID
  const randomConvoId = `conv-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const chatUrl = `${baseUrl}/${username}/agents/${agentUid}/chat/${randomConvoId}`;

  const curlCommand = `curl -X POST "${baseUrl}/api/chat/${username}/${agentUid}/conversation/${randomConvoId}" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_TPMJS_API_KEY" \\
  -d '{"message": "Hello!"}'`;

  return [
    { label: 'Agent UID', value: agentUid, description: agentUid },
    { label: 'Chat URL', value: chatUrl, description: chatUrl },
    { label: 'cURL', value: curlCommand, description: 'Send a message via API' },
  ];
}
