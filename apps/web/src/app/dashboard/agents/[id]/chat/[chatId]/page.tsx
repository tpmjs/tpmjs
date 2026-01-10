'use client';

import type { AIProvider } from '@tpmjs/types/agent';
import { Button } from '@tpmjs/ui/Button/Button';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { DashboardLayout } from '~/components/dashboard/DashboardLayout';

interface Agent {
  id: string;
  uid: string;
  name: string;
  description: string | null;
  provider: AIProvider;
  modelId: string;
}

interface MessageToolCall {
  toolCallId: string;
  toolName: string;
  args?: Record<string, unknown>;
}

interface Message {
  id: string;
  role: 'USER' | 'ASSISTANT' | 'TOOL';
  content: string;
  toolName?: string;
  toolCallId?: string;
  toolResult?: unknown;
  toolCalls?: MessageToolCall[] | null;
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
 * Check if a tool output contains an error
 */
function isToolError(output: unknown): boolean {
  if (!output || typeof output !== 'object') return false;
  const obj = output as Record<string, unknown>;
  return (
    obj.success === false ||
    obj.error !== undefined ||
    obj.__tpmjs_error__ !== undefined ||
    (typeof obj.message === 'string' && obj.message.toLowerCase().includes('error'))
  );
}

/**
 * Extract error message from tool output
 */
function getErrorMessage(output: unknown): string | null {
  if (!output || typeof output !== 'object') return null;
  const obj = output as Record<string, unknown>;
  if (typeof obj.error === 'string') return obj.error;
  if (typeof obj.__tpmjs_error__ === 'string') return obj.__tpmjs_error__;
  if (obj.success === false && typeof obj.message === 'string') return obj.message;
  return null;
}

/**
 * Sexy tool call debug card component
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
  // Detect if the output contains an error
  const hasError = Boolean(toolCall.output && isToolError(toolCall.output));
  const errorMessage = hasError ? getErrorMessage(toolCall.output) : null;
  const effectiveStatus = hasError ? 'error' : toolCall.status;

  const statusColors = {
    pending:
      'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-300 dark:border-yellow-500/30',
    running:
      'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-500/30',
    success:
      'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 border-green-300 dark:border-green-500/30',
    error:
      'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 border-red-300 dark:border-red-500/30',
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
    <div
      className={`rounded-lg border overflow-hidden font-mono text-xs ${hasError ? 'border-red-500/50 bg-red-50 dark:bg-red-500/5' : 'border-border bg-slate-50 dark:bg-surface-secondary/50'}`}
    >
      {/* Header */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-3 hover:bg-slate-100 dark:hover:bg-surface-secondary/80 transition-colors"
      >
        <div className={`p-1.5 rounded ${statusColors[effectiveStatus]}`}>
          <Icon
            icon={statusIcons[effectiveStatus]}
            size="xs"
            className={effectiveStatus === 'running' ? 'animate-spin' : ''}
          />
        </div>
        <div className="flex-1 text-left">
          <div className="flex items-center gap-2">
            <span className="text-foreground font-semibold">{toolCall.toolName}</span>
            <span className="text-foreground-tertiary text-[10px]">
              {toolCall.toolCallId.slice(0, 8)}...
            </span>
            {hasError && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400">
                ERROR
              </span>
            )}
          </div>
          {/* Show error message preview in header */}
          {hasError && errorMessage && !isExpanded && (
            <div className="text-red-600 dark:text-red-400 text-[10px] mt-1 truncate max-w-[300px]">
              {errorMessage}
            </div>
          )}
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

          {/* Error Message Section */}
          {hasError && errorMessage && (
            <div className="p-3 bg-red-100 dark:bg-red-500/10 border-b border-red-200 dark:border-red-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Icon icon="alertCircle" size="xs" className="text-red-600 dark:text-red-400" />
                <span className="text-[10px] uppercase tracking-wider text-red-600 dark:text-red-400 font-semibold">
                  Error
                </span>
              </div>
              <p className="text-[11px] text-red-600 dark:text-red-400">{errorMessage}</p>
            </div>
          )}

          {/* Output Section */}
          {toolCall.output !== undefined && toolCall.output !== null ? (
            <div className="p-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] uppercase tracking-wider text-foreground-tertiary">
                  {hasError ? 'Full Response' : 'Output'}
                </span>
                <div className="flex-1 h-px bg-border/50" />
              </div>
              <pre
                className={`text-[11px] overflow-x-auto whitespace-pre-wrap break-all max-h-48 overflow-y-auto ${hasError ? 'text-red-600 dark:text-red-300' : 'text-emerald-700 dark:text-green-400'}`}
              >
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

interface Conversation {
  id: string;
  slug: string;
  title: string | null;
  messageCount: number;
  updatedAt: string;
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

export default function AgentChatPage(): React.ReactElement {
  const params = useParams();
  const router = useRouter();
  const agentId = params.id as string;
  const chatId = params.chatId as string;

  const [agent, setAgent] = useState<Agent | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  // Use chatId from URL as the active conversation
  const activeConversationId = chatId;
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

  // Fetch agent data
  const fetchAgent = useCallback(async () => {
    try {
      const response = await fetch(`/api/agents/${agentId}`);
      const data = await response.json();

      if (data.success) {
        setAgent(data.data);
      } else {
        if (response.status === 401) {
          router.push('/sign-in');
          return;
        }
        setError(data.error || 'Failed to fetch agent');
      }
    } catch (err) {
      console.error('Failed to fetch agent:', err);
      setError('Failed to fetch agent');
    }
  }, [agentId, router]);

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    if (!agent) return;

    try {
      const response = await fetch(`/api/agents/${agentId}/conversations`);
      const data = await response.json();

      if (data.success) {
        setConversations(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
    }
  }, [agent, agentId]);

  // Fetch messages for active conversation
  const fetchMessages = useCallback(async () => {
    if (!agent || !activeConversationId) return;

    try {
      const response = await fetch(`/api/agents/${agentId}/conversation/${activeConversationId}`);
      const data = await response.json();

      if (data.success) {
        const msgs = data.data.messages || [];
        console.log(
          '[fetchMessages] Received messages:',
          msgs.length,
          msgs.map((m: Message) => ({ role: m.role, toolName: m.toolName }))
        );
        setMessages(msgs);
      }
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    }
  }, [agent, agentId, activeConversationId]);

  useEffect(() => {
    const init = async () => {
      await fetchAgent();
      setIsLoading(false);
    };
    init();
  }, [fetchAgent]);

  useEffect(() => {
    if (agent) {
      fetchConversations();
    }
  }, [agent, fetchConversations]);

  useEffect(() => {
    if (activeConversationId) {
      fetchMessages();
    } else {
      setMessages([]);
    }
  }, [activeConversationId, fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  });

  // Navigate to conversation when selected from sidebar
  const handleSelectConversation = (convSlug: string) => {
    router.push(`/dashboard/agents/${agentId}/chat/${convSlug}`);
  };

  const handleSend = async () => {
    if (!input.trim() || !agent || isSending) return;

    const messageContent = input.trim();
    setInput('');
    setIsSending(true);
    setStreamingContent('');
    setError(null);
    setToolCalls([]);

    // Use the chatId from URL
    const conversationId = activeConversationId || chatId;

    // Optimistically add user message
    const userMessage: Message = {
      id: `temp-${Date.now()}`,
      role: 'USER',
      content: messageContent,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);

    try {
      const response = await fetch(`/api/agents/${agentId}/conversation/${conversationId}`, {
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
                console.log('[SSE] Complete event received, fetching messages...');
                await fetchMessages();
                await fetchConversations();
                setStreamingContent('');
                setToolCalls([]);
                console.log('[SSE] Messages and conversations refreshed');
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
    const newId = generateConversationId();
    router.push(`/dashboard/agents/${agentId}/chat/${newId}`);
  };

  if (isLoading) {
    return (
      <DashboardLayout
        title="Loading..."
        showBackButton
        backUrl={`/dashboard/agents/${agentId}`}
        fullHeight
      >
        <div className="flex items-center justify-center h-full">
          <Icon icon="loader" size="lg" className="animate-spin text-foreground-secondary" />
        </div>
      </DashboardLayout>
    );
  }

  if (error && !agent) {
    return (
      <DashboardLayout title="Error" showBackButton backUrl="/dashboard/agents" fullHeight>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <Icon icon="alertCircle" size="lg" className="mx-auto text-error mb-4" />
            <h2 className="text-lg font-medium text-foreground mb-2">Error</h2>
            <p className="text-foreground-secondary mb-4">{error}</p>
            <Link href="/dashboard/agents">
              <Button>Back to Agents</Button>
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!agent) {
    return (
      <DashboardLayout
        title="Loading..."
        showBackButton
        backUrl={`/dashboard/agents/${agentId}`}
        fullHeight
      >
        <div className="flex items-center justify-center h-full">
          <Icon icon="loader" size="lg" className="animate-spin text-foreground-secondary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title={`Chat with ${agent.name}`}
      subtitle={PROVIDER_DISPLAY_NAMES[agent.provider]}
      showBackButton
      backUrl={`/dashboard/agents/${agent.id}`}
      fullHeight
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              window.open(
                `/api/agents/${agentId}/conversation/${activeConversationId}?format=json`,
                '_blank'
              );
            }}
            title="View conversation as JSON"
          >
            <Icon icon="terminal" size="xs" className="mr-2" />
            JSON
          </Button>
          <Button variant="outline" size="sm" onClick={startNewConversation}>
            <Icon icon="plus" size="xs" className="mr-2" />
            New Chat
          </Button>
        </div>
      }
    >
      <div className="flex h-full overflow-hidden">
        {/* Conversations Sidebar */}
        <div className="w-64 border-r border-border flex flex-col bg-surface-secondary/30 hidden md:flex">
          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto p-2">
            {conversations.length === 0 ? (
              <p className="text-sm text-foreground-tertiary text-center py-4">
                No conversations yet
              </p>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv.id}
                  type="button"
                  onClick={() => handleSelectConversation(conv.slug)}
                  className={`w-full text-left px-3 py-2 rounded-lg mb-1 transition-colors ${
                    chatId === conv.slug
                      ? 'bg-primary/10 text-primary'
                      : 'text-foreground-secondary hover:bg-surface-secondary'
                  }`}
                >
                  <p className="text-sm font-medium truncate">{conv.title || 'Untitled Chat'}</p>
                  <p className="text-xs text-foreground-tertiary">{conv.messageCount} messages</p>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
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

            {(() => {
              // Build a map of toolCallId -> tool result from TOOL messages
              const toolResultsMap = new Map<string, unknown>();
              for (const msg of messages) {
                if (msg.role === 'TOOL' && msg.toolCallId) {
                  let output: unknown;
                  if (msg.toolResult) {
                    output = msg.toolResult;
                  } else {
                    try {
                      output = JSON.parse(msg.content || '{}');
                    } catch {
                      output = { result: msg.content };
                    }
                  }
                  toolResultsMap.set(msg.toolCallId, output);
                }
              }

              return messages.map((message) => {
                // Check if this ASSISTANT message has embedded tool calls
                const hasEmbeddedToolCalls =
                  message.role === 'ASSISTANT' &&
                  message.toolCalls &&
                  Array.isArray(message.toolCalls) &&
                  message.toolCalls.length > 0;

                return (
                  <div key={message.id} className="space-y-2">
                    {/* Render embedded tool calls from ASSISTANT messages */}
                    {hasEmbeddedToolCalls && (
                      <div className="space-y-2">
                        {message.toolCalls?.map((tc) => {
                          // Look up the output for this tool call
                          const toolOutput = toolResultsMap.get(tc.toolCallId);
                          const hasOutput = toolOutput !== undefined;

                          return (
                            <div key={tc.toolCallId} className="flex justify-start">
                              <div className="max-w-[80%]">
                                <ToolCallCard
                                  toolCall={{
                                    toolCallId: tc.toolCallId,
                                    toolName: tc.toolName,
                                    input: tc.args,
                                    output: toolOutput,
                                    status: hasOutput ? 'success' : 'pending',
                                  }}
                                  isExpanded={expandedToolCalls.has(tc.toolCallId)}
                                  onToggle={() => toggleToolCall(tc.toolCallId)}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Render the message content - skip TOOL messages as they're shown with their calls */}
                    {message.role !== 'TOOL' && (
                      <div
                        className={`flex ${message.role === 'USER' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg p-4 ${
                            message.role === 'USER'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-surface-secondary'
                          }`}
                        >
                          <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              });
            })()}

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
                className="flex-1 px-4 py-3 bg-surface border border-border rounded-lg text-foreground placeholder:text-foreground-tertiary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary resize-none min-h-[48px] max-h-[200px]"
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
    </DashboardLayout>
  );
}
