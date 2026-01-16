'use client';

import type { AIProvider } from '@tpmjs/types/agent';
import { Badge } from '@tpmjs/ui/Badge/Badge';
import { Button } from '@tpmjs/ui/Button/Button';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import { Textarea } from '@tpmjs/ui/Textarea/Textarea';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Streamdown } from 'streamdown';
import type { AgentSettings } from '~/components/agents/ChatSettingsDrawer';
import { ChatSettingsDrawer } from '~/components/agents/ChatSettingsDrawer';
import type { CollectionInfo, ToolInfo } from '~/components/agents/ChatToolsPanel';
import { ChatToolsPanel } from '~/components/agents/ChatToolsPanel';
import { ToolDetailsModal } from '~/components/agents/ToolDetailsModal';
import { DashboardLayout } from '~/components/dashboard/DashboardLayout';

interface Agent {
  id: string;
  uid: string;
  name: string;
  description: string | null;
  provider: AIProvider;
  modelId: string;
  systemPrompt: string | null;
  temperature: number;
  maxToolCallsPerTurn: number;
  maxMessagesInContext: number;
  tools: ToolInfo[];
  collections: CollectionInfo[];
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
 * Tool call card with style guide aesthetics
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
  const hasError = Boolean(toolCall.output && isToolError(toolCall.output));
  const errorMessage = hasError ? getErrorMessage(toolCall.output) : null;
  const effectiveStatus = hasError ? 'error' : toolCall.status;

  const statusColors = {
    pending: 'bg-warning/10 text-warning border-warning/30',
    running: 'bg-info/10 text-info border-info/30',
    success: 'bg-success/10 text-success border-success/30',
    error: 'bg-error/10 text-error border-error/30',
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
    <fieldset
      className={`border border-dashed overflow-hidden font-mono text-xs ${
        hasError ? 'border-error/50 bg-error/5' : 'border-border bg-surface-secondary/30'
      }`}
    >
      {/* header */}
      <Button
        variant="ghost"
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-3 h-auto justify-start rounded-none hover:bg-surface-secondary/80"
      >
        <div className={`p-1.5 rounded ${statusColors[effectiveStatus]}`}>
          <Icon
            icon={statusIcons[effectiveStatus]}
            size="xs"
            className={effectiveStatus === 'running' ? 'animate-spin' : ''}
          />
        </div>
        <div className="flex-1 text-left min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-foreground font-semibold truncate">{toolCall.toolName}</span>
            <span className="text-foreground-tertiary text-[10px]">
              {toolCall.toolCallId.slice(0, 8)}...
            </span>
            {hasError && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-error/10 text-error uppercase">
                error
              </span>
            )}
          </div>
          {hasError && errorMessage && !isExpanded && (
            <div className="text-error text-[10px] mt-1 truncate max-w-[300px]">{errorMessage}</div>
          )}
        </div>
        <Icon
          icon="chevronRight"
          size="xs"
          className={`text-foreground-tertiary transition-transform flex-shrink-0 ${isExpanded ? 'rotate-90' : ''}`}
        />
      </Button>

      {/* expanded content */}
      {isExpanded && (
        <div className="border-t border-dashed border-border">
          {/* input */}
          {toolCall.input !== undefined && toolCall.input !== null ? (
            <div className="p-3 border-b border-dashed border-border/50">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] uppercase tracking-wider text-foreground-tertiary">
                  input
                </span>
                <div className="flex-1 h-px bg-border/50" />
              </div>
              <pre className="text-[11px] text-foreground-secondary overflow-x-auto whitespace-pre-wrap break-all max-h-48 overflow-y-auto">
                {formatJson(toolCall.input)}
              </pre>
            </div>
          ) : null}

          {/* error message */}
          {hasError && errorMessage && (
            <div className="p-3 bg-error/10 border-b border-dashed border-error/20">
              <div className="flex items-center gap-2 mb-2">
                <Icon icon="alertCircle" size="xs" className="text-error" />
                <span className="text-[10px] uppercase tracking-wider text-error font-semibold">
                  error
                </span>
              </div>
              <p className="text-[11px] text-error">{errorMessage}</p>
            </div>
          )}

          {/* output */}
          {toolCall.output !== undefined && toolCall.output !== null ? (
            <div className="p-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] uppercase tracking-wider text-foreground-tertiary">
                  {hasError ? 'full response' : 'output'}
                </span>
                <div className="flex-1 h-px bg-border/50" />
              </div>
              <pre
                className={`text-[11px] overflow-x-auto whitespace-pre-wrap break-all max-h-48 overflow-y-auto ${hasError ? 'text-error' : 'text-success'}`}
              >
                {formatJson(toolCall.output)}
              </pre>
            </div>
          ) : null}

          {/* running indicator */}
          {toolCall.status === 'running' && !toolCall.output && (
            <div className="p-3 flex items-center gap-2 text-foreground-tertiary">
              <Icon icon="loader" size="xs" className="animate-spin" />
              <span>executing...</span>
            </div>
          )}
        </div>
      )}
    </fieldset>
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
  const activeConversationId = chatId;
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [toolCalls, setToolCalls] = useState<ToolCall[]>([]);
  const [expandedToolCalls, setExpandedToolCalls] = useState<Set<string>>(new Set());

  // UI state
  const [showToolsPanel, setShowToolsPanel] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedTool, setSelectedTool] = useState<ToolInfo | null>(null);

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
        buffer = lines.pop() || '';

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
                setToolCalls((prev) => [
                  ...prev,
                  {
                    toolCallId: data.toolCallId,
                    toolName: data.toolName,
                    input: data.input,
                    status: 'running',
                  },
                ]);
                setExpandedToolCalls((prev) => new Set([...prev, data.toolCallId]));
                break;
              case 'tool_result':
                setToolCalls((prev) =>
                  prev.map((tc) =>
                    tc.toolCallId === data.toolCallId
                      ? { ...tc, output: data.output, status: 'success' as const }
                      : tc
                  )
                );
                break;
              case 'complete':
                await fetchMessages();
                await fetchConversations();
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

  const handleSettingsChange = (newSettings: AgentSettings) => {
    if (agent) {
      setAgent({
        ...agent,
        ...newSettings,
      });
    }
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
      title={agent.name}
      subtitle={`${PROVIDER_DISPLAY_NAMES[agent.provider]} / ${agent.modelId}`}
      showBackButton
      backUrl={`/dashboard/agents/${agent.id}`}
      fullHeight
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowToolsPanel(!showToolsPanel)}
            title={showToolsPanel ? 'Hide tools panel' : 'Show tools panel'}
            className={showToolsPanel ? 'bg-primary/10 text-primary' : ''}
          >
            <Icon icon="puzzle" size="xs" className="mr-1.5" />
            <span className="hidden sm:inline">Tools</span>
            {agent.tools.length > 0 && (
              <Badge variant="secondary" className="ml-1.5 text-[10px]">
                {agent.tools.length}
              </Badge>
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSettings(true)}
            title="Agent settings"
          >
            <Icon icon="edit" size="xs" className="mr-1.5" />
            <span className="hidden sm:inline">Settings</span>
          </Button>
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
            <Icon icon="terminal" size="xs" />
          </Button>
          <Button variant="outline" size="sm" onClick={startNewConversation}>
            <Icon icon="plus" size="xs" className="mr-1.5" />
            New Chat
          </Button>
        </div>
      }
    >
      <div className="flex h-full overflow-hidden">
        {/* Conversations Sidebar */}
        <div className="w-56 border-r border-dashed border-border flex flex-col bg-surface hidden md:flex">
          <div className="p-3 border-b border-dashed border-border">
            <span className="font-mono text-xs text-foreground-tertiary lowercase">
              conversations
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {conversations.length === 0 ? (
              <p className="text-xs text-foreground-tertiary text-center py-4 font-mono">
                no conversations yet
              </p>
            ) : (
              conversations.map((conv) => (
                <button
                  type="button"
                  key={conv.id}
                  onClick={() => handleSelectConversation(conv.slug)}
                  className={`w-full text-left p-2 mb-1 rounded border border-transparent transition-colors ${
                    chatId === conv.slug
                      ? 'bg-primary/10 border-primary/20 text-primary'
                      : 'text-foreground-secondary hover:bg-surface-secondary hover:border-border'
                  }`}
                >
                  <p className="text-sm font-medium truncate">{conv.title || 'Untitled Chat'}</p>
                  <p className="text-[10px] text-foreground-tertiary font-mono mt-0.5">
                    {conv.messageCount} messages
                  </p>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && !streamingContent && (
              <div className="flex items-center justify-center h-full">
                <fieldset className="border border-dashed border-border p-8 max-w-md text-center">
                  <legend className="px-2 font-mono text-xs text-foreground-tertiary lowercase">
                    new conversation
                  </legend>
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Icon icon="message" size="lg" className="text-primary" />
                  </div>
                  <h3 className="font-mono text-foreground mb-2 lowercase">start chatting</h3>
                  <p className="text-sm text-foreground-secondary">
                    Send a message to start a conversation with {agent.name}.
                  </p>
                </fieldset>
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
                          const toolOutput = toolResultsMap.get(tc.toolCallId);
                          const hasOutput = toolOutput !== undefined;

                          return (
                            <div key={tc.toolCallId} className="flex justify-start">
                              <div className="max-w-[85%]">
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

                    {/* Render the message content - skip TOOL messages */}
                    {message.role !== 'TOOL' && (
                      <div
                        className={`flex ${message.role === 'USER' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-lg p-4 ${
                            message.role === 'USER'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-surface border border-dashed border-border'
                          }`}
                        >
                          {message.role === 'USER' ? (
                            <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                          ) : (
                            <div className="text-sm prose prose-sm dark:prose-invert max-w-none">
                              <Streamdown>{message.content}</Streamdown>
                            </div>
                          )}
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
                    <div className="max-w-[85%]">
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
                <div className="max-w-[85%] rounded-lg p-4 bg-surface border border-dashed border-border">
                  <div className="text-sm prose prose-sm dark:prose-invert max-w-none">
                    <Streamdown>{streamingContent}</Streamdown>
                  </div>
                  <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-1" />
                </div>
              </div>
            )}

            {isSending && !streamingContent && toolCalls.length === 0 && (
              <div className="flex justify-start">
                <div className="rounded-lg p-4 bg-surface border border-dashed border-border">
                  <div className="flex items-center gap-2 text-foreground-secondary">
                    <Icon icon="loader" size="sm" className="animate-spin" />
                    <span className="text-sm font-mono lowercase">thinking...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Error Message */}
          {error && (
            <div className="px-4 py-2 bg-error/10 border-t border-dashed border-error/20">
              <p className="text-sm text-error font-mono">{error}</p>
            </div>
          )}

          {/* Input Area */}
          <div className="border-t border-dashed border-border p-4 bg-surface">
            <div className="flex items-end gap-2">
              <Textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                rows={1}
                resize="none"
                className="flex-1 min-h-[48px] max-h-[200px] font-mono"
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
            <p className="text-[10px] text-foreground-tertiary mt-2 font-mono">
              enter to send, shift+enter for new line
            </p>
          </div>
        </div>

        {/* Tools Panel */}
        <ChatToolsPanel
          tools={agent.tools}
          collections={agent.collections}
          isOpen={showToolsPanel}
          onClose={() => setShowToolsPanel(false)}
          onToolClick={setSelectedTool}
        />
      </div>

      {/* Tool Details Modal */}
      <ToolDetailsModal
        tool={selectedTool}
        open={!!selectedTool}
        onClose={() => setSelectedTool(null)}
      />

      {/* Settings Drawer */}
      <ChatSettingsDrawer
        open={showSettings}
        onClose={() => setShowSettings(false)}
        agentId={agent.id}
        settings={{
          name: agent.name,
          provider: agent.provider,
          modelId: agent.modelId,
          systemPrompt: agent.systemPrompt,
          temperature: agent.temperature,
          maxToolCallsPerTurn: agent.maxToolCallsPerTurn,
          maxMessagesInContext: agent.maxMessagesInContext,
        }}
        onSettingsChange={handleSettingsChange}
      />
    </DashboardLayout>
  );
}
