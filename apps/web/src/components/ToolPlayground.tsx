'use client';

/**
 * ToolPlayground component
 * Interactive playground for executing TPMJS tools with AI agents
 */

import type { TokenBreakdown as TokenData } from '@/lib/ai-agent/tool-executor-agent';
import type { Tool } from '@tpmjs/db';
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { TokenBreakdown } from './TokenBreakdown';

interface ToolPlaygroundProps {
  tool: Tool;
}

type Tab = 'input' | 'output' | 'logs' | 'tokens';

interface ExecutionLog {
  level: 'info' | 'warning' | 'error' | 'debug';
  message: string;
  timestamp: Date;
}

export function ToolPlayground({ tool }: ToolPlaygroundProps): React.ReactElement {
  const [activeTab, setActiveTab] = useState<Tab>('input');
  const [prompt, setPrompt] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [output, setOutput] = useState('');
  const [logs, setLogs] = useState<ExecutionLog[]>([]);
  const [tokens, setTokens] = useState<TokenData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rateLimitInfo, setRateLimitInfo] = useState<{ remaining: number } | null>(null);

  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: SSE stream handling requires sequential logic
  const handleExecute = async () => {
    if (!prompt.trim() || isExecuting) return;

    setIsExecuting(true);
    setOutput('');
    setError(null);
    setLogs([]);
    setTokens(null);
    setActiveTab('output');

    try {
      const response = await fetch(
        `/api/tools/execute/${encodeURIComponent(tool.npmPackageName)}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ prompt }),
        }
      );

      // Check rate limit headers
      const remaining = response.headers.get('X-RateLimit-Remaining');
      if (remaining) {
        setRateLimitInfo({ remaining: Number.parseInt(remaining, 10) });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Execution failed');
      }

      // Handle SSE stream
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body');
      }

      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('event:')) {
            const event = line.slice(6).trim();
            const nextLine = lines.shift();

            if (nextLine?.startsWith('data:')) {
              const data = JSON.parse(nextLine.slice(5).trim());

              switch (event) {
                case 'chunk':
                  setOutput((prev) => prev + data.text);
                  setLogs((prev) => [
                    ...prev,
                    {
                      level: 'info',
                      message: `Streaming: ${data.text.slice(0, 50)}${data.text.length > 50 ? '...' : ''}`,
                      timestamp: new Date(),
                    },
                  ]);
                  break;

                case 'tokens':
                  setTokens(data as TokenData);
                  setLogs((prev) => [
                    ...prev,
                    {
                      level: 'debug',
                      message: `Token update: ${data.totalTokens || 0} total tokens`,
                      timestamp: new Date(),
                    },
                  ]);
                  break;

                case 'complete':
                  // Don't replace output - keep the streamed text
                  // setOutput(data.output); // Removed: this was overwriting streamed content
                  setTokens(data.tokenBreakdown);
                  setLogs((prev) => [
                    ...prev,
                    {
                      level: 'info',
                      message: `Execution completed in ${data.executionTimeMs}ms with ${data.agentSteps} agent steps`,
                      timestamp: new Date(),
                    },
                  ]);
                  break;

                case 'error':
                  setError(data.message);
                  setLogs((prev) => [
                    ...prev,
                    {
                      level: 'error',
                      message: data.message,
                      timestamp: new Date(),
                    },
                  ]);
                  break;
              }
            }
          }
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      setLogs((prev) => [
        ...prev,
        {
          level: 'error',
          message,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsExecuting(false);
    }
  };

  const tabs: { id: Tab; label: string; badge?: string }[] = [
    { id: 'input', label: 'Input' },
    { id: 'output', label: 'Output', badge: output ? '✓' : undefined },
    { id: 'logs', label: 'Logs', badge: logs.length > 0 ? logs.length.toString() : undefined },
    { id: 'tokens', label: 'Token Usage', badge: tokens ? '✓' : undefined },
  ];

  const getLevelBadgeColor = (level: ExecutionLog['level']) => {
    switch (level) {
      case 'info':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400';
      case 'warning':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400';
      case 'error':
        return 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400';
      case 'debug':
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-background">
      {/* Header */}
      <div className="border-b border-border bg-muted/30 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Interactive Playground</h2>
            <p className="text-sm text-foreground-secondary mt-1">
              Test {tool.npmPackageName} with AI-powered execution
            </p>
          </div>
          {rateLimitInfo && (
            <div className="text-sm text-foreground-secondary">
              {rateLimitInfo.remaining} executions remaining
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border bg-muted/10">
        <div className="flex space-x-1 px-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium transition-colors relative ${
                activeTab === tab.id
                  ? 'text-foreground border-b-2 border-primary'
                  : 'text-foreground-secondary hover:text-foreground'
              }`}
            >
              {tab.label}
              {tab.badge && (
                <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs rounded-full bg-primary/10 text-primary">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'input' && (
          <div className="space-y-4">
            <div>
              <label htmlFor="prompt" className="block text-sm font-medium text-foreground mb-2">
                Prompt
              </label>
              <textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Enter your prompt here... (e.g., 'Create a blog post about TypeScript best practices')"
                className="w-full h-32 px-4 py-3 rounded-lg border border-input bg-background text-foreground placeholder:text-foreground-tertiary focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                disabled={isExecuting}
              />
              <p className="text-xs text-foreground-tertiary mt-2">
                {prompt.length}/2000 characters
              </p>
            </div>

            <button
              type="button"
              onClick={handleExecute}
              disabled={isExecuting || !prompt.trim()}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isExecuting ? (
                <span className="flex items-center">
                  {/* biome-ignore lint/a11y/noSvgWithoutTitle: decorative loading spinner */}
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Executing...
                </span>
              ) : (
                'Execute'
              )}
            </button>
          </div>
        )}

        {activeTab === 'output' && (
          <div className="space-y-4">
            {error ? (
              <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900">
                <p className="text-sm text-red-700 dark:text-red-400 font-medium">Error</p>
                <p className="text-sm text-red-600 dark:text-red-500 mt-1">{error}</p>
              </div>
            ) : output ? (
              <div className="rounded-lg border border-border bg-muted/30 p-6 prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{output}</ReactMarkdown>
              </div>
            ) : isExecuting ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  {/* biome-ignore lint/a11y/noSvgWithoutTitle: decorative loading spinner */}
                  <svg
                    className="animate-spin h-8 w-8 text-primary mx-auto mb-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <p className="text-sm text-foreground-secondary">Executing...</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-foreground-secondary">
                  No output yet. Execute a prompt to see results.
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="space-y-2">
            {logs.length > 0 ? (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {logs.map((log, index) => (
                  <div key={index} className="flex items-start space-x-3 text-sm">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium uppercase ${getLevelBadgeColor(log.level)}`}
                    >
                      {log.level}
                    </span>
                    <div className="flex-1">
                      <p className="text-foreground">{log.message}</p>
                      <p className="text-xs text-foreground-tertiary mt-0.5">
                        {log.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-foreground-secondary">
                  No logs yet. Execute a prompt to see logs.
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'tokens' && (
          <div>
            {tokens ? (
              <TokenBreakdown tokens={tokens} />
            ) : (
              <div className="text-center py-12">
                <p className="text-foreground-secondary">
                  No token data yet. Execute a prompt to see token usage.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
