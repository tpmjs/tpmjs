'use client';

import type { AIProvider } from '@tpmjs/types/agent';
import { Button } from '@tpmjs/ui/Button/Button';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppHeader } from '~/components/AppHeader';

interface Agent {
  id: string;
  uid: string;
  name: string;
  description: string | null;
  provider: AIProvider;
  modelId: string;
  createdBy: {
    id: string;
    name: string;
    image: string | null;
  };
}

interface Message {
  id: string;
  role: 'USER' | 'ASSISTANT' | 'TOOL';
  content: string;
  toolName?: string;
  toolCallId?: string;
  toolResult?: unknown;
  createdAt: string;
}

interface ToolCall {
  toolCallId: string;
  toolName: string;
  input?: unknown;
  output?: unknown;
  status: 'pending' | 'running' | 'success' | 'error';
}

/**
 * Tool call debug card component
 */
function ToolCallCard({
  toolCall,
  isExpanded,
  onToggle,
}: {
  toolCall: ToolCall;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const statusColors = {
    pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    running: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    success: 'bg-green-500/20 text-green-400 border-green-500/30',
    error: 'bg-red-500/20 text-red-400 border-red-500/30',
  };

  const statusIcons: Record<ToolCall['status'], 'loader' | 'check' | 'alertCircle' | 'info'> = {
    pending: 'info',
    running: 'loader',
    success: 'check',
    error: 'alertCircle',
  };

  const formatJson = (data: unknown): React.ReactNode => {
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return String(data);
    }
  };

  return (
    <div className="rounded-lg border border-border bg-surface-secondary/50 overflow-hidden font-mono text-xs">
      {/* Header */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-3 hover:bg-surface-secondary/80 transition-colors"
      >
        <div className={`p-1.5 rounded ${statusColors[toolCall.status]}`}>
          <Icon
            icon={statusIcons[toolCall.status]}
            size="xs"
            className={toolCall.status === 'running' ? 'animate-spin' : ''}
          />
        </div>
        <div className="flex-1 text-left">
          <div className="flex items-center gap-2">
            <span className="text-foreground font-semibold">{toolCall.toolName}</span>
            <span className="text-foreground-tertiary text-[10px]">
              {toolCall.toolCallId.slice(0, 8)}...
            </span>
          </div>
        </div>
        <Icon
          icon="chevronRight"
          size="xs"
          className={`text-foreground-tertiary transition-transform ${isExpanded ? 'rotate-90' : ''}`}
        />
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-border">
          {/* Input Section */}
          {toolCall.input !== undefined && toolCall.input !== null ? (
            <div className="p-3 border-b border-border/50">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] uppercase tracking-wider text-foreground-tertiary">
                  Input
                </span>
                <div className="flex-1 h-px bg-border/50" />
              </div>
              <pre className="text-[11px] text-foreground-secondary overflow-x-auto whitespace-pre-wrap break-all max-h-48 overflow-y-auto">
                {formatJson(toolCall.input)}
              </pre>
            </div>
          ) : null}

          {/* Output Section */}
          {toolCall.output !== undefined && toolCall.output !== null ? (
            <div className="p-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] uppercase tracking-wider text-foreground-tertiary">
                  Output
                </span>
                <div className="flex-1 h-px bg-border/50" />
              </div>
              <pre className="text-[11px] text-green-400 overflow-x-auto whitespace-pre-wrap break-all max-h-48 overflow-y-auto">
                {formatJson(toolCall.output)}
              </pre>
            </div>
          ) : null}

          {/* Status indicator for running */}
          {toolCall.status === 'running' && !toolCall.output && (
            <div className="p-3 flex items-center gap-2 text-foreground-tertiary">
              <Icon icon="loader" size="xs" className="animate-spin" />
              <span>Executing...</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const PROVIDER_DISPLAY_NAMES: Record<AIProvider, string> = {
  OPENAI: 'OpenAI',
  ANTHROPIC: 'Anthropic',
  GOOGLE: 'Google',
  GROQ: 'Groq',
  MISTRAL: 'Mistral',
};

function generateConversationId(): string {
  return `conv-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export default function PublicAgentChatPage(): React.ReactElement {
  const params = useParams();
  const searchParams = useSearchParams();
  const agentId = params.id as string;

  // Generate a unique conversation ID on mount, or use one from URL
  const conversationId = useMemo(() => {
    return searchParams.get('c') || generateConversationId();
  }, [searchParams]);

  const [agent, setAgent] = useState<Agent | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [toolCalls, setToolCalls] = useState<ToolCall[]>([]);
  const [expandedToolCalls, setExpandedToolCalls] = useState<Set<string>>(new Set());

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const toggleToolCall = (toolCallId: string) => {
    setExpandedToolCalls((prev) => {
      const next = new Set(prev);
      if (next.has(toolCallId)) {
        next.delete(toolCallId);
      } else {
        next.add(toolCallId);
      }
      return next;
    });
  };

  // Fetch public agent data
  const fetchAgent = useCallback(async () => {
    try {
      const response = await fetch(`/api/public/agents/${agentId}`);
      const data = await response.json();

      if (data.success) {
        setAgent(data.data);
      } else {
        setError(data.error?.message || 'Agent not found or is private');
      }
    } catch (err) {
      console.error('Failed to fetch agent:', err);
      setError('Failed to fetch agent');
    }
  }, [agentId]);

  // Fetch messages for conversation
  const fetchMessages = useCallback(async () => {
    if (!agent) return;

    try {
      const response = await fetch(`/api/agents/${agent.uid}/conversation/${conversationId}`);
      if (response.status === 404) {
        // Conversation doesn't exist yet, that's fine
        return;
      }
      const data = await response.json();

      if (data.success) {
        setMessages(data.data.messages || []);
      }
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    }
  }, [agent, conversationId]);

  useEffect(() => {
    const init = async () => {
      await fetchAgent();
      setIsLoading(false);
    };
    init();
  }, [fetchAgent]);

  useEffect(() => {
    if (agent) {
      fetchMessages();
    }
  }, [agent, fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  });

  const handleSend = async () => {
    if (!input.trim() || !agent || isSending) return;

    const messageContent = input.trim();
    setInput('');
    setIsSending(true);
    setStreamingContent('');
    setError(null);
    setToolCalls([]);

    // Optimistically add user message
    const userMessage: Message = {
      id: `temp-${Date.now()}`,
      role: 'USER',
      content: messageContent,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);

    try {
      const response = await fetch(`/api/agents/${agent.uid}/conversation/${conversationId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageContent }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send message');
      }

      // Handle SSE stream
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Parse SSE events
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        let eventType = '';
        for (const line of lines) {
          if (line.startsWith('event: ')) {
            eventType = line.slice(7);
          } else if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));

            switch (eventType) {
              case 'chunk':
                setStreamingContent((prev) => prev + data.text);
                break;
              case 'tool_call':
                // Add tool call to tracking
                setToolCalls((prev) => [
                  ...prev,
                  {
                    toolCallId: data.toolCallId,
                    toolName: data.toolName,
                    input: data.input,
                    status: 'running',
                  },
                ]);
                // Auto-expand new tool calls
                setExpandedToolCalls((prev) => new Set([...prev, data.toolCallId]));
                break;
              case 'tool_result':
                // Update tool call with result
                setToolCalls((prev) =>
                  prev.map((tc) =>
                    tc.toolCallId === data.toolCallId
                      ? { ...tc, output: data.output, status: 'success' as const }
                      : tc
                  )
                );
                break;
              case 'complete':
                // Refresh messages
                await fetchMessages();
                setStreamingContent('');
                setToolCalls([]);
                break;
              case 'error':
                throw new Error(data.message);
            }
          }
        }
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      setError(err instanceof Error ? err.message : 'Failed to send message');
      // Remove optimistic message on error
      setMessages((prev) => prev.filter((m) => m.id !== userMessage.id));
    } finally {
      setIsSending(false);
      setStreamingContent('');
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const startNewConversation = () => {
    // Navigate to same page with new conversation ID
    const newId = generateConversationId();
    window.location.href = `/agents/${agentId}/chat?c=${newId}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <Icon icon="loader" size="lg" className="animate-spin text-foreground-secondary" />
        </div>
      </div>
    );
  }

  if (error && !agent) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <div className="text-center">
            <Icon icon="alertCircle" size="lg" className="mx-auto text-error mb-4" />
            <h2 className="text-lg font-medium text-foreground mb-2">Unable to Chat</h2>
            <p className="text-foreground-secondary mb-4">{error}</p>
            <Link href="/agents">
              <Button>Browse Agents</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <Icon icon="loader" size="lg" className="animate-spin text-foreground-secondary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader />

      {/* Chat Header */}
      <div className="border-b border-border bg-surface/50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href={`/agents/${agentId}`}
              className="text-foreground-secondary hover:text-foreground transition-colors"
            >
              <Icon icon="arrowLeft" size="sm" />
            </Link>
            <div>
              <h1 className="text-lg font-semibold text-foreground">{agent.name}</h1>
              <p className="text-sm text-foreground-tertiary">
                {PROVIDER_DISPLAY_NAMES[agent.provider]} • Created by {agent.createdBy.name}
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={startNewConversation}>
            <Icon icon="plus" size="xs" className="mr-2" />
            New Chat
          </Button>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && !streamingContent && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Icon icon="message" size="lg" className="text-primary" />
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">Start a conversation</h3>
                <p className="text-foreground-secondary max-w-sm">
                  Send a message to start chatting with {agent.name}.
                </p>
              </div>
            </div>
          )}

          {messages.map((message) => {
            // Parse tool output safely
            const getToolOutput = () => {
              if (message.toolResult) return message.toolResult;
              try {
                return JSON.parse(message.content || '{}');
              } catch {
                return { result: message.content };
              }
            };

            return (
              <div
                key={message.id}
                className={`flex ${message.role === 'USER' ? 'justify-end' : 'justify-start'}`}
              >
                {message.role === 'TOOL' ? (
                  <div className="max-w-[80%]">
                    <ToolCallCard
                      toolCall={{
                        toolCallId: message.toolCallId || message.id,
                        toolName: message.toolName || 'Unknown Tool',
                        output: getToolOutput(),
                        status: 'success',
                      }}
                      isExpanded={expandedToolCalls.has(message.toolCallId || message.id)}
                      onToggle={() => toggleToolCall(message.toolCallId || message.id)}
                    />
                  </div>
                ) : (
                  <div
                    className={`max-w-[80%] rounded-lg p-4 ${
                      message.role === 'USER'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-surface-secondary'
                    }`}
                  >
                    <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                  </div>
                )}
              </div>
            );
          })}

          {/* Live tool calls during streaming */}
          {toolCalls.length > 0 && (
            <div className="space-y-2">
              {toolCalls.map((tc) => (
                <div key={tc.toolCallId} className="flex justify-start">
                  <div className="max-w-[80%]">
                    <ToolCallCard
                      toolCall={tc}
                      isExpanded={expandedToolCalls.has(tc.toolCallId)}
                      onToggle={() => toggleToolCall(tc.toolCallId)}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {streamingContent && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-lg p-4 bg-surface-secondary">
                <p className="whitespace-pre-wrap text-sm">{streamingContent}</p>
                <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-1" />
              </div>
            </div>
          )}

          {isSending && !streamingContent && toolCalls.length === 0 && (
            <div className="flex justify-start">
              <div className="rounded-lg p-4 bg-surface-secondary">
                <div className="flex items-center gap-2 text-foreground-secondary">
                  <Icon icon="loader" size="sm" className="animate-spin" />
                  <span className="text-sm">Thinking...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Error Message */}
        {error && (
          <div className="px-4 py-2 bg-red-50 dark:bg-red-900/20 border-t border-red-200 dark:border-red-800">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Input Area */}
        <div className="border-t border-border p-4">
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              rows={1}
              className="flex-1 px-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder:text-foreground-tertiary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary resize-none min-h-[48px] max-h-[200px]"
              style={{
                height: 'auto',
                minHeight: '48px',
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = `${Math.min(target.scrollHeight, 200)}px`;
              }}
            />
            <Button onClick={handleSend} disabled={isSending || !input.trim()}>
              <Icon icon="send" size="sm" />
            </Button>
          </div>
          <p className="text-xs text-foreground-tertiary mt-2">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}
