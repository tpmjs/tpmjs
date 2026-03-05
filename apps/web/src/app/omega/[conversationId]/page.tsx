'use client';

import { Badge } from '@tpmjs/ui/Badge/Badge';
import { Button } from '@tpmjs/ui/Button/Button';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import { Textarea } from '@tpmjs/ui/Textarea/Textarea';
import { registerBuiltInRenderers } from '@tpmjs/ui/ToolRenderer/registerBuiltInRenderers';
import { ToolRenderer } from '@tpmjs/ui/ToolRenderer/ToolRenderer';
import type { ToolPart, ToolState } from '@tpmjs/ui/ToolRenderer/types';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Streamdown } from 'streamdown';
import { AppHeader } from '~/components/AppHeader';
import { EnvVarWarningBanner } from '~/components/omega/EnvVarWarningBanner';

// Initialize built-in tool renderers (idempotent)
registerBuiltInRenderers();

interface ToolDiscoveryInfo {
  staticTools?: string[];
  dynamicToolsLoaded?: string[];
  autoDiscoveredTools?: Array<{
    toolId: string;
    name: string;
    packageName: string;
    description: string;
  }>;
}

interface Message {
  id: string;
  role: 'USER' | 'ASSISTANT' | 'TOOL';
  content: string;
  toolCalls?: Array<{
    toolCallId: string;
    toolName: string;
    args?: unknown;
    output?: unknown;
  }>;
  inputTokens?: number;
  outputTokens?: number;
  createdAt: string;
  toolDiscovery?: ToolDiscoveryInfo;
}

interface ToolCall {
  toolCallId: string;
  toolName: string;
  input?: unknown;
  output?: unknown;
  status: 'pending' | 'running' | 'success' | 'error';
  isError?: boolean;
}

interface EnvVarWarning {
  toolId: string;
  toolName: string;
  packageName: string;
  envVar: {
    name: string;
    description: string;
    required: boolean;
  };
}

interface Conversation {
  id: string;
  title: string | null;
  executionState: string;
  inputTokensTotal: number;
  outputTokensTotal: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Convert ToolCall status to ToolState
 */
function statusToToolState(status: ToolCall['status']): ToolState {
  switch (status) {
    case 'pending':
      return 'partial-call';
    case 'running':
      return 'call';
    case 'success':
    case 'error':
      return 'result';
  }
}

/**
 * Convert ToolCall to ToolPart for rendering
 */
function toolCallToToolPart(tc: ToolCall): ToolPart {
  return {
    type: tc.status === 'success' || tc.status === 'error' ? 'tool-result' : 'tool-call',
    toolCallId: tc.toolCallId,
    toolName: tc.toolName,
    args: tc.input,
    result: tc.isError ? { error: tc.output } : tc.output,
    state: statusToToolState(tc.status),
  };
}

const CAPABILITY_ICONS = ['search', 'terminal', 'globe', 'database', 'mail'] as const;

/**
 * Omega Chat Page — Modern Agentic Interface
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Complex chat page with multiple UI states and SSE handling
export default function OmegaChatPage(): React.ReactElement {
  const params = useParams();
  const router = useRouter();
  const conversationId = params.conversationId as string;

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [toolCalls, setToolCalls] = useState<ToolCall[]>([]);
  const [viewMode, setViewMode] = useState<'chat' | 'debug'>('chat');
  const [messageToolDiscovery, setMessageToolDiscovery] = useState<Map<string, ToolDiscoveryInfo>>(
    new Map()
  );
  const [envWarnings, setEnvWarnings] = useState<EnvVarWarning[]>([]);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isNearBottomRef = useRef(true);

  // Fetch conversation details
  const fetchConversation = useCallback(async () => {
    try {
      const response = await fetch(`/api/omega/conversations/${conversationId}`);

      if (response.status === 404) {
        setError('Conversation not found');
        setIsLoading(false);
        return;
      }

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch conversation');
      }

      const data = await response.json();
      const { messages: messageList, ...conversationData } = data.data;
      setConversation(conversationData);
      setMessages(messageList || []);
    } catch (err) {
      console.error('Failed to fetch conversation:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch conversation');
    } finally {
      setIsLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    fetchConversation();
  }, [fetchConversation]);

  // Smart auto-scroll
  const handleScroll = useCallback(() => {
    const el = messagesContainerRef.current;
    if (!el) return;
    isNearBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: We intentionally trigger scroll when messages/streamingContent change
  useEffect(() => {
    if (isNearBottomRef.current && messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages, streamingContent]);

  // Check for initial prompt from landing page
  // biome-ignore lint/correctness/useExhaustiveDependencies: Only run on mount and when messages load
  useEffect(() => {
    const initialPrompt = sessionStorage.getItem(`omega_prompt_${conversationId}`);
    if (initialPrompt && messages.length === 0 && !isSending) {
      sessionStorage.removeItem(`omega_prompt_${conversationId}`);
      setInput(initialPrompt);
      const timer = setTimeout(() => {
        handleSendWithContent(initialPrompt);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [conversationId, messages.length]);

  // Stop button handler
  const handleStop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsSending(false);
    setStatusMessage(null);
    setStreamingContent((prev) => {
      if (prev) {
        const partialMessage: Message = {
          id: `partial-${Date.now()}`,
          role: 'ASSISTANT',
          content: prev,
          createdAt: new Date().toISOString(),
        };
        setMessages((msgs) => [...msgs, partialMessage]);
      }
      return '';
    });
    setToolCalls([]);
    inputRef.current?.focus();
  }, []);

  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Chat send handler with streaming and tool calls
  const handleSendWithContent = async (messageContent: string) => {
    if (!messageContent.trim() || isSending) return;

    setInput('');
    setIsSending(true);
    setStreamingContent('');
    setError(null);
    setToolCalls([]);
    setStatusMessage(null);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    const userMessage: Message = {
      id: `temp-${Date.now()}`,
      role: 'USER',
      content: messageContent,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);

    let accumulatedContent = '';
    let completedToolCalls: ToolCall[] = [];

    try {
      const response = await fetch(`/api/omega/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageContent }),
        signal: controller.signal,
      });

      if (!response.ok) {
        let errorMessage = 'Failed to send message';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        let eventType = '';
        for (const line of lines) {
          if (line.startsWith('event: ')) {
            eventType = line.slice(7);
          } else if (line.startsWith('data: ')) {
            let data: unknown;
            try {
              data = JSON.parse(line.slice(6));
            } catch {
              console.warn('Failed to parse SSE data:', line.slice(6));
              continue;
            }

            const d = data as Record<string, unknown>;

            switch (eventType) {
              case 'status':
                if (d.message && typeof d.message === 'string') {
                  setStatusMessage(d.message);
                }
                break;
              case 'env.warning':
                if (d.missingEnvVars && Array.isArray(d.missingEnvVars)) {
                  setEnvWarnings(d.missingEnvVars as EnvVarWarning[]);
                }
                break;
              case 'message.delta':
                setStatusMessage(null);
                accumulatedContent += (d as { content: string }).content;
                setStreamingContent((prev) => prev + (d as { content: string }).content);
                break;
              case 'run.step.tool.started':
                setStatusMessage(null);
                setToolCalls((prev) => {
                  const updated = [
                    ...prev,
                    {
                      toolCallId: d.toolCallId as string,
                      toolName: d.toolName as string,
                      input: d.input,
                      status: 'running' as const,
                    },
                  ];
                  completedToolCalls = updated;
                  return updated;
                });
                break;
              case 'run.step.tool.completed':
                setToolCalls((prev) => {
                  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Tool call update logic
                  const updated = prev.map((tc) =>
                    tc.toolCallId === d.toolCallId
                      ? {
                          ...tc,
                          output: d.output,
                          status: d.isError ? ('error' as const) : ('success' as const),
                          isError: d.isError as boolean | undefined,
                        }
                      : tc
                  );
                  completedToolCalls = updated;
                  return updated;
                });
                break;
              case 'run.completed': {
                const assistantMessage: Message = {
                  id: (d.messageId as string) || `msg-${Date.now()}`,
                  role: 'ASSISTANT',
                  content: accumulatedContent,
                  toolCalls: completedToolCalls
                    .filter((tc) => tc.status === 'success' || tc.status === 'error')
                    .map((tc) => ({
                      toolCallId: tc.toolCallId,
                      toolName: tc.toolName,
                      args: tc.input,
                      output: tc.output,
                    })),
                  inputTokens: d.inputTokens as number,
                  outputTokens: d.outputTokens as number,
                  createdAt: new Date().toISOString(),
                };

                const toolResultEntries = completedToolCalls
                  .filter((tc) => tc.output !== undefined)
                  .map((tc) => ({
                    toolCallId: tc.toolCallId,
                    toolName: tc.toolName,
                    output: tc.output,
                  }));

                setMessages((prev) => {
                  const updated = [...prev, assistantMessage];
                  if (toolResultEntries.length > 0) {
                    updated.push({
                      id: `tool-${Date.now()}`,
                      role: 'TOOL',
                      content: 'Tool results',
                      toolCalls: toolResultEntries,
                      createdAt: new Date().toISOString(),
                    });
                  }
                  return updated;
                });

                if (conversation) {
                  setConversation({
                    ...conversation,
                    inputTokensTotal:
                      conversation.inputTokensTotal + ((d.inputTokens as number) || 0),
                    outputTokensTotal:
                      conversation.outputTokensTotal + ((d.outputTokens as number) || 0),
                    executionState: 'idle',
                  });
                }

                const toolDiscovery: ToolDiscoveryInfo = {
                  staticTools: d.staticTools as string[],
                  dynamicToolsLoaded: d.dynamicToolsLoaded as string[],
                  autoDiscoveredTools:
                    d.autoDiscoveredTools as ToolDiscoveryInfo['autoDiscoveredTools'],
                };
                setMessageToolDiscovery((prev) => {
                  const next = new Map(prev);
                  next.set(assistantMessage.id, toolDiscovery);
                  return next;
                });

                setStreamingContent('');
                setToolCalls([]);
                setStatusMessage(null);
                break;
              }
              case 'run.failed':
                throw new Error(d.error as string);
            }
          }
        }
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return;
      }
      console.error('Failed to send message:', err);
      setError(err instanceof Error ? err.message : 'Failed to send message');
      setMessages((prev) => prev.filter((m) => m.id !== userMessage.id));
    } finally {
      abortControllerRef.current = null;
      setIsSending(false);
      setStreamingContent('');
      setStatusMessage(null);
      inputRef.current?.focus();
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isSending) return;
    await handleSendWithContent(input.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const startNewConversation = async () => {
    try {
      const response = await fetch('/api/omega/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create conversation');
      }

      const data = await response.json();
      router.push(`/omega/${data.data.id}`);
    } catch (err) {
      console.error('Failed to create conversation:', err);
      setError(err instanceof Error ? err.message : 'Failed to create conversation');
    }
  };

  // --- Loading State ---
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <div className="flex flex-col items-center gap-4 opacity-0 animate-in fade-in duration-500">
            <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            <span className="font-medium text-sm text-foreground-secondary tracking-wide">
              Initializing Session...
            </span>
          </div>
        </div>
      </div>
    );
  }

  // --- Error State (no conversation) ---
  if (error && !conversation) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex items-center justify-center h-[calc(100vh-64px)] px-4">
          <div className="text-center bg-surface p-8 rounded-3xl border border-border/50 shadow-xl max-w-md w-full opacity-0 animate-in fade-in zoom-in-95 duration-500">
            <div className="w-16 h-16 bg-error/10 text-error rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Icon icon="alertCircle" size="lg" />
            </div>
            <h2 className="text-xl font-bold text-foreground tracking-tight mb-2">
              Unable to Load Chat
            </h2>
            <p className="text-foreground-secondary text-sm mb-8 leading-relaxed">{error}</p>
            <Link href="/omega">
              <Button className="w-full rounded-full shadow-md hover:shadow-lg transition-all">Start New Conversation</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans text-foreground selection:bg-primary/30">
      <AppHeader />

      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Header */}
        <div className="border-b border-border/50 px-4 md:px-6 py-3 bg-surface/50 backdrop-blur-md z-10 shadow-sm sticky top-0">
          <div className="flex items-center justify-between max-w-5xl mx-auto">
            <div className="flex items-center gap-4">
              <Link
                href="/omega"
                className="p-2 rounded-full text-foreground-secondary hover:text-foreground hover:bg-background border border-transparent hover:border-border/50 transition-all"
              >
                <Icon icon="arrowLeft" size="sm" />
              </Link>
              <div className="flex flex-col">
                <h1 className="text-sm font-semibold text-foreground truncate max-w-[300px]">
                  {conversation?.title || 'New Conversation'}
                </h1>
                <span className="text-[10px] text-primary font-medium tracking-wide">
                  GPT-4o Mini / TPMJS Tools
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Segmented Tab Switcher */}
              <div className="flex p-1 rounded-full bg-surface border border-border/50 mr-2 shadow-inner">
                <button
                  type="button"
                  onClick={() => setViewMode('chat')}
                  className={`px-4 py-1.5 rounded-full text-[11px] font-semibold transition-all ${
                    viewMode === 'chat'
                      ? 'bg-foreground text-background shadow-md'
                      : 'text-foreground-secondary hover:text-foreground hover:bg-background/50'
                  }`}
                >
                  Chat
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('debug')}
                  className={`px-4 py-1.5 rounded-full text-[11px] font-semibold transition-all ${
                    viewMode === 'debug'
                      ? 'bg-foreground text-background shadow-md'
                      : 'text-foreground-secondary hover:text-foreground hover:bg-background/50'
                  }`}
                >
                  Debug
                </button>
              </div>
              <Link href="/omega/settings">
                <Button variant="outline" size="sm" className="rounded-full w-9 h-9 p-0 flex items-center justify-center border-border/50 shadow-sm hover:border-primary/50 hover:text-primary">
                  <Icon icon="key" size="xs" />
                </Button>
              </Link>
              <Button variant="default" size="sm" onClick={startNewConversation} className="rounded-full w-9 h-9 p-0 flex items-center justify-center shadow-md shadow-primary/20 hover:shadow-primary/40">
                <Icon icon="plus" size="xs" />
              </Button>
            </div>
          </div>
        </div>

        {/* Debug JSON View */}
        {viewMode === 'debug' && (
          <div className="flex-1 overflow-auto p-4 bg-background">
            <div className="max-w-5xl mx-auto space-y-6">
              <div className="flex items-start justify-between bg-surface p-6 rounded-2xl border border-border/50 shadow-sm">
                <div>
                  <h2 className="font-semibold text-foreground tracking-tight text-lg mb-1">
                    Discovery Telemetry ({messages.length} messages)
                  </h2>
                  <p className="text-sm text-foreground-secondary">
                    Each message shows the tools discovered and loaded dynamically during that response.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full shadow-sm"
                  onClick={() => {
                    const messagesWithTools = messages.map((m) => ({
                      ...m,
                      toolDiscovery: messageToolDiscovery.get(m.id) || null,
                    }));
                    navigator.clipboard.writeText(JSON.stringify(messagesWithTools, null, 2));
                  }}
                >
                  <Icon icon="copy" size="xs" className="mr-2" />
                  Copy JSON
                </Button>
              </div>

              {/* biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Debug view with multiple conditional sections */}
              {messages.map((message, index) => {
                const discovery = messageToolDiscovery.get(message.id);
                return (
                  <div
                    key={message.id}
                    className="bg-surface rounded-2xl border border-border/50 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="px-6 py-4 border-b border-border/50 bg-background/50 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-foreground-tertiary font-mono">
                            #{index + 1}
                          </span>
                          <Badge
                            variant={
                              message.role === 'USER'
                                ? 'secondary'
                                : message.role === 'ASSISTANT'
                                  ? 'default'
                                  : 'outline'
                            }
                            size="sm"
                            className="rounded-full px-3 py-0.5"
                          >
                            {message.role}
                          </Badge>
                          <span className="text-xs text-foreground-tertiary font-mono">
                            {message.id.slice(0, 8)}...
                          </span>
                        </div>
                        <span className="text-xs text-foreground-secondary font-medium">
                          {new Date(message.createdAt).toLocaleTimeString()}
                        </span>
                    </div>

                    <div className="p-6 space-y-6">
                      <div>
                        <div className="text-xs font-semibold text-foreground-secondary uppercase tracking-wider mb-3">
                          Content
                        </div>
                        <pre className="text-sm font-mono bg-background border border-border/50 rounded-xl p-4 overflow-x-auto whitespace-pre-wrap max-h-48 overflow-y-auto shadow-inner text-foreground-secondary">
                          {message.content || '(empty)'}
                        </pre>
                      </div>

                      {message.role === 'ASSISTANT' && discovery && (
                        <div className="space-y-4 pt-4 border-t border-border/50">
                          <div className="text-xs font-semibold text-foreground-secondary uppercase tracking-wider">
                            Tool Discovery Payload
                          </div>

                          {discovery.staticTools && discovery.staticTools.length > 0 && (
                            <div>
                              <div className="text-sm text-foreground-secondary mb-2 font-medium">
                                Static Tools ({discovery.staticTools.length})
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {discovery.staticTools.map((name) => (
                                  <span
                                    key={name}
                                    className="px-3 py-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full text-xs font-mono border border-blue-500/20"
                                  >
                                    {name}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {discovery.autoDiscoveredTools &&
                            discovery.autoDiscoveredTools.length > 0 && (
                              <div>
                                <div className="text-sm text-foreground-secondary mb-2 font-medium">
                                  Auto-Discovered via BM25 ({discovery.autoDiscoveredTools.length})
                                </div>
                                <div className="space-y-2">
                                  {discovery.autoDiscoveredTools.map((t) => (
                                    <div
                                      key={t.toolId}
                                      className="text-xs font-mono bg-background border border-border/50 rounded-lg p-3 flex flex-col gap-1"
                                    >
                                      <div>
                                        <span className="text-primary font-semibold">{t.packageName}</span>
                                        <span className="text-foreground-tertiary px-1">::</span>
                                        <span className="text-foreground font-medium">{t.name}</span>
                                      </div>
                                      <span className="text-foreground-tertiary">
                                        {t.description?.slice(0, 100)}
                                        {(t.description?.length || 0) > 100 ? '...' : ''}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                          {discovery.dynamicToolsLoaded &&
                            discovery.dynamicToolsLoaded.length > 0 && (
                              <div>
                                <div className="text-sm text-foreground-secondary mb-2 font-medium">
                                  Dynamic Tools Loaded ({discovery.dynamicToolsLoaded.length})
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {discovery.dynamicToolsLoaded.map((name) => (
                                    <span
                                      key={name}
                                      className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-mono border border-primary/20"
                                    >
                                      {name}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                        </div>
                      )}

                      {message.toolCalls && message.toolCalls.length > 0 && (
                        <div className="pt-4 border-t border-border/50">
                          <div className="text-xs font-semibold text-foreground-secondary uppercase tracking-wider mb-3">
                            Tool Calls ({message.toolCalls.length})
                          </div>
                          <pre className="text-sm font-mono bg-background border border-border/50 rounded-xl p-4 overflow-x-auto whitespace-pre-wrap max-h-48 overflow-y-auto shadow-inner text-foreground-secondary">
                            {JSON.stringify(message.toolCalls, null, 2)}
                          </pre>
                        </div>
                      )}

                      {(message.inputTokens || message.outputTokens) && (
                        <div className="text-xs font-medium text-foreground-tertiary pt-4 border-t border-border/50 flex gap-4">
                          {message.inputTokens && <span className="flex items-center gap-1.5"><Icon icon="logIn" size="xs" /> {message.inputTokens} Input</span>}
                          {message.outputTokens && <span className="flex items-center gap-1.5"><Icon icon="logOut" size="xs" /> {message.outputTokens} Output</span>}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {messages.length === 0 && (
                <div className="text-center py-16 text-foreground-secondary text-sm bg-surface rounded-2xl border border-border/50 border-dashed">
                  No messages yet. Start a conversation to see debug telemetry.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Chat View */}
        {viewMode === 'chat' && (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-hidden">
              {messages.length === 0 && !streamingContent ? (
                /* Empty State */
                <div className="h-full flex flex-col items-center justify-center p-8 relative">
                  {/* Subtle background glow */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/5 rounded-full blur-[80px] pointer-events-none" />
                  
                  <div className="text-center relative z-10 max-w-md animate-in fade-in zoom-in-95 duration-700">
                    <div className="w-20 h-20 bg-surface border border-border/50 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl shadow-primary/5">
                      <Icon icon="terminal" size="lg" className="text-primary" />
                    </div>
                    
                    <h2 className="text-2xl font-bold text-foreground tracking-tight mb-3">
                      How can I help you today?
                    </h2>

                    <p className="text-[15px] text-foreground-secondary leading-relaxed mb-8">
                      Describe your task. I will search the TPMJS registry, dynamically load the required tools, and execute them in a secure sandbox.
                    </p>

                    <div className="flex flex-wrap items-center justify-center gap-3">
                      {CAPABILITY_ICONS.map((icon, i) => (
                        <div
                          key={icon}
                          className="w-10 h-10 rounded-xl bg-surface border border-border/50 flex items-center justify-center shadow-sm text-foreground-tertiary"
                        >
                          <Icon icon={icon} size="sm" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  ref={messagesContainerRef}
                  className="h-full overflow-y-auto scroll-smooth"
                  onScroll={handleScroll}
                >
                  <div className="max-w-4xl mx-auto py-6">
                    {messages.map((message) => (
                      <div key={message.id} className="px-4 md:px-6 py-3 w-full">
                        {/* USER message */}
                        {message.role === 'USER' && (
                          <div className="flex justify-end w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="max-w-[85%] md:max-w-[75%] px-5 py-3.5 bg-foreground text-background rounded-3xl rounded-tr-sm shadow-md">
                              <div className="text-[15px] whitespace-pre-wrap leading-relaxed">{message.content}</div>
                            </div>
                          </div>
                        )}

                        {/* ASSISTANT message */}
                        {message.role === 'ASSISTANT' && message.content && (
                          <div className="flex gap-4 w-full max-w-[85%] md:max-w-[90%] animate-in fade-in duration-300">
                            <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 mt-1">
                              <Icon icon="terminal" size="xs" className="text-primary" />
                            </div>
                            <div className="flex-1 min-w-0 pt-1.5">
                              <div className="text-[15px] prose prose-slate dark:prose-invert max-w-none leading-relaxed prose-p:leading-relaxed prose-pre:bg-surface prose-pre:border prose-pre:border-border/50 prose-pre:rounded-xl">
                                <Streamdown>{message.content}</Streamdown>
                              </div>
                              {(message.inputTokens || message.outputTokens) && (
                                <div className="mt-3 flex items-center gap-3 text-[11px] text-foreground-tertiary font-medium">
                                  {message.inputTokens && <span>{message.inputTokens} in</span>}
                                  {message.inputTokens && message.outputTokens && <span className="w-1 h-1 rounded-full bg-border" />}
                                  {message.outputTokens && <span>{message.outputTokens} out</span>}
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* TOOL message */}
                        {message.role === 'TOOL' && message.toolCalls && (
                          <div className="pl-12 space-y-3 mt-2 w-full max-w-[95%]">
                            {message.toolCalls.map((tc) => (
                              <div key={tc.toolCallId} className="bg-surface border border-border/50 rounded-2xl overflow-hidden shadow-sm">
                                <ToolRenderer
                                  part={{
                                    type: 'tool-result',
                                    toolCallId: tc.toolCallId,
                                    toolName: tc.toolName,
                                    args: tc.args,
                                    result: tc.output,
                                    state: 'result',
                                  }}
                                  isStreaming={false}
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Tool Execution Pipeline */}
                    {toolCalls.length > 0 && (
                      <div className="px-4 md:px-6 py-4 pl-16">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="relative flex items-center justify-center w-5 h-5">
                            <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
                            <div className="w-2 h-2 rounded-full bg-primary relative z-10" />
                          </div>
                          <span className="text-xs font-semibold text-primary uppercase tracking-widest">
                            Executing {toolCalls.length} tool{toolCalls.length !== 1 ? 's' : ''}
                          </span>
                        </div>

                        <div className="space-y-3 relative before:absolute before:inset-y-0 before:left-[21px] before:w-px before:bg-gradient-to-b before:from-primary/50 before:to-transparent">
                          {toolCalls.map((tc) => (
                            <div key={tc.toolCallId} className="relative pl-10">
                              <div className="absolute left-[19px] top-4 w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary),0.5)] z-10" />
                              <div className="bg-surface border border-primary/20 rounded-2xl overflow-hidden shadow-lg shadow-primary/5 transition-all">
                                <ToolRenderer
                                  part={toolCallToToolPart(tc)}
                                  isStreaming={tc.status === 'running'}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Streaming content */}
                    {streamingContent && (
                      <div className="px-4 md:px-6 py-3 flex gap-4 w-full max-w-[85%] md:max-w-[90%]">
                        <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 mt-1">
                          <Icon icon="terminal" size="xs" className="text-primary" />
                        </div>
                        <div className="flex-1 min-w-0 pt-1.5">
                          <div className="text-[15px] prose prose-slate dark:prose-invert max-w-none leading-relaxed">
                            <Streamdown>{streamingContent}</Streamdown>
                            <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-1 align-middle rounded-sm" />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Thinking indicator */}
                    {isSending && !streamingContent && toolCalls.length === 0 && (
                      <div className="px-4 md:px-6 py-4 flex gap-4 w-full max-w-[85%]">
                        <div className="w-8 h-8 rounded-full bg-surface border border-border/50 flex items-center justify-center flex-shrink-0 mt-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-foreground-tertiary animate-pulse" />
                        </div>
                        <div className="pt-2">
                          <span className="text-[14px] text-foreground-secondary font-medium animate-pulse">
                            {statusMessage || 'Synthesizing response...'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Environment Variable Warnings */}
            {envWarnings.length > 0 && (
              <EnvVarWarningBanner warnings={envWarnings} onDismiss={() => setEnvWarnings([])} />
            )}

            {/* Error Message */}
            {error && (
              <div className="px-6 py-3 bg-error/10 border-t border-error/20 backdrop-blur-md">
                <div className="max-w-4xl mx-auto flex items-center gap-3">
                  <Icon icon="alertCircle" size="sm" className="text-error flex-shrink-0" />
                  <p className="text-sm text-error font-medium">{error}</p>
                </div>
              </div>
            )}

            {/* Input Area */}
            <div className="border-t border-border/50 bg-background/80 backdrop-blur-xl px-4 md:px-6 py-4 pb-6">
              <div className="max-w-4xl mx-auto relative">
                <div className="relative bg-surface border border-border/50 rounded-3xl shadow-sm focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10 transition-all flex items-end">
                  <Textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Message Omega..."
                    rows={1}
                    resize="none"
                    className="border-none bg-transparent min-h-[56px] max-h-[200px] py-4 pl-6 pr-14 text-[15px] focus:ring-0 leading-relaxed placeholder:text-foreground-tertiary"
                    style={{
                      height: 'auto',
                      minHeight: '56px',
                    }}
                    onInput={(e) => {
                      const target = e.target as HTMLTextAreaElement;
                      target.style.height = 'auto';
                      target.style.height = `${Math.min(target.scrollHeight, 200)}px`;
                    }}
                  />
                  <div className="absolute right-2 bottom-2">
                    {isSending ? (
                      <Button
                        onClick={handleStop}
                        variant="destructive"
                        className="rounded-full w-10 h-10 p-0 flex items-center justify-center shadow-sm"
                      >
                        <Icon icon="x" size="sm" />
                      </Button>
                    ) : (
                      <Button
                        onClick={handleSend}
                        disabled={!input.trim()}
                        className={`rounded-full w-10 h-10 p-0 flex items-center justify-center transition-all ${
                          input.trim() ? 'shadow-md shadow-primary/25 bg-primary text-primary-foreground hover:bg-primary-hover' : 'bg-surface-secondary text-foreground-tertiary border border-border/50 shadow-none'
                        }`}
                        variant="unstyled"
                      >
                        <Icon icon="send" size="sm" className={input.trim() ? 'ml-0.5' : ''} />
                      </Button>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between mt-2 px-2">
                  <span className="text-[11px] text-foreground-tertiary font-medium">
                    Omega can make mistakes. Check important info.
                  </span>
                  {conversation && (
                    <span className="text-[11px] text-foreground-tertiary font-mono">
                      {(
                        conversation.inputTokensTotal + conversation.outputTokensTotal
                      ).toLocaleString()}{' '}
                      tokens
                    </span>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
