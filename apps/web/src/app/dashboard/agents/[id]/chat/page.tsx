'use client';

import type { AIProvider } from '@tpmjs/types/agent';
import { Button } from '@tpmjs/ui/Button/Button';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppHeader } from '~/components/AppHeader';

interface Agent {
  id: string;
  uid: string;
  name: string;
  description: string | null;
  provider: AIProvider;
  modelId: string;
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

export default function AgentChatPage(): React.ReactElement {
  const params = useParams();
  const router = useRouter();
  const agentId = params.id as string;

  const [agent, setAgent] = useState<Agent | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
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
      const response = await fetch(`/api/agents/${agent.uid}/conversations`);
      const data = await response.json();

      if (data.success) {
        setConversations(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
    }
  }, [agent]);

  // Fetch messages for active conversation
  const fetchMessages = useCallback(async () => {
    if (!agent || !activeConversationId) return;

    try {
      const response = await fetch(`/api/agents/${agent.uid}/conversation/${activeConversationId}`);
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
  }, [agent, activeConversationId]);

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

  const generateConversationId = () => {
    return `conv-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  };

  const handleSend = async () => {
    if (!input.trim() || !agent || isSending) return;

    const messageContent = input.trim();
    setInput('');
    setIsSending(true);
    setStreamingContent('');
    setError(null);
    setToolCalls([]);

    // Create new conversation if needed
    const conversationId = activeConversationId || generateConversationId();
    if (!activeConversationId) {
      setActiveConversationId(conversationId);
    }

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
    setActiveConversationId(null);
    setMessages([]);
    inputRef.current?.focus();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="max-w-6xl mx-auto py-12 px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-surface-secondary rounded w-48 mb-8" />
            <div className="h-96 bg-surface-secondary rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (error && !agent) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="max-w-6xl mx-auto py-12 px-4">
          <div className="text-center py-16">
            <Icon icon="alertCircle" size="lg" className="mx-auto text-error mb-4" />
            <h2 className="text-lg font-medium text-foreground mb-2">Error</h2>
            <p className="text-foreground-secondary mb-4">{error}</p>
            <Link href="/dashboard/agents">
              <Button>Back to Agents</Button>
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
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <Icon icon="loader" size="lg" className="animate-spin text-foreground-secondary" />
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      <AppHeader />

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 border-r border-border flex flex-col bg-surface-secondary/50">
          {/* Agent Info */}
          <div className="p-4 border-b border-border">
            <Link
              href={`/dashboard/agents/${agent.id}`}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Icon icon="terminal" size="sm" className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-medium text-foreground truncate">{agent.name}</h2>
                <p className="text-xs text-foreground-tertiary">
                  {PROVIDER_DISPLAY_NAMES[agent.provider]}
                </p>
              </div>
            </Link>
          </div>

          {/* New Conversation Button */}
          <div className="p-4">
            <Button className="w-full" onClick={startNewConversation}>
              <Icon icon="plus" size="xs" className="mr-2" />
              New Chat
            </Button>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto p-2">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                type="button"
                onClick={() => setActiveConversationId(conv.slug)}
                className={`w-full text-left px-3 py-2 rounded-lg mb-1 transition-colors ${
                  activeConversationId === conv.slug
                    ? 'bg-primary/10 text-primary'
                    : 'text-foreground-secondary hover:bg-surface-secondary'
                }`}
              >
                <p className="text-sm font-medium truncate">{conv.title || 'Untitled Chat'}</p>
                <p className="text-xs text-foreground-tertiary">{conv.messageCount} messages</p>
              </button>
            ))}
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
    </div>
  );
}
