'use client';

import { Badge } from '@tpmjs/ui/Badge/Badge';
import { Button } from '@tpmjs/ui/Button/Button';
import { CodeBlock } from '@tpmjs/ui/CodeBlock/CodeBlock';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AppHeader } from '~/components/AppHeader';

const NAV_SECTIONS = [
  {
    title: 'Getting Started',
    items: [
      { id: 'overview', label: 'Overview' },
      { id: 'api-keys', label: 'API Keys Setup' },
      { id: 'creating-agents', label: 'Creating Agents' },
    ],
  },
  {
    title: 'Features',
    items: [
      { id: 'attaching-tools', label: 'Attaching Tools' },
      { id: 'chat-interface', label: 'Chat Interface' },
      { id: 'providers', label: 'Supported Providers' },
    ],
  },
  {
    title: 'API Reference',
    items: [
      { id: 'conversation-api', label: 'Conversation API' },
      { id: 'sse-events', label: 'SSE Events' },
      { id: 'endpoints', label: 'All Endpoints' },
    ],
  },
];

function SidebarNav({
  activeSection,
  onSectionClick,
}: {
  activeSection: string;
  onSectionClick: (id: string) => void;
}) {
  return (
    <nav className="space-y-6">
      {NAV_SECTIONS.map((section) => (
        <div key={section.title}>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground-tertiary mb-2">
            {section.title}
          </h3>
          <ul className="space-y-1">
            {section.items.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onSectionClick(item.id)}
                  className={`block w-full text-left px-3 py-1.5 text-sm rounded-md transition-colors ${
                    activeSection === item.id
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-foreground-secondary hover:text-foreground hover:bg-surface-elevated'
                  }`}
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function DocSection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 mb-16">
      <h2 className="text-2xl font-bold mb-6 text-foreground pb-3 border-b border-border">
        {title}
      </h2>
      {children}
    </section>
  );
}

function DocSubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h3 className="text-lg font-semibold mb-4 text-foreground">{title}</h3>
      {children}
    </div>
  );
}

function ParamTable({
  params,
}: {
  params: { name: string; type: string; required: boolean; description: string }[];
}) {
  return (
    <div className="overflow-x-auto border border-border rounded-lg">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-surface">
            <th className="text-left py-3 px-4 text-foreground font-medium">Parameter</th>
            <th className="text-left py-3 px-4 text-foreground font-medium">Type</th>
            <th className="text-left py-3 px-4 text-foreground font-medium">Required</th>
            <th className="text-left py-3 px-4 text-foreground font-medium">Description</th>
          </tr>
        </thead>
        <tbody>
          {params.map((param, i) => (
            <tr
              key={param.name}
              className={i !== params.length - 1 ? 'border-b border-border' : ''}
            >
              <td className="py-3 px-4 font-mono text-primary">{param.name}</td>
              <td className="py-3 px-4 font-mono text-foreground-secondary">{param.type}</td>
              <td className="py-3 px-4">
                {param.required ? (
                  <Badge variant="default" size="sm">
                    Yes
                  </Badge>
                ) : (
                  <span className="text-foreground-tertiary">No</span>
                )}
              </td>
              <td className="py-3 px-4 text-foreground-secondary">{param.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function InfoCard({
  icon,
  title,
  children,
}: {
  icon: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="p-5 border border-border rounded-lg bg-surface">
      <div className="flex items-start gap-3">
        <span className="text-2xl flex-shrink-0">{icon}</span>
        <div>
          <h4 className="font-semibold text-foreground mb-1">{title}</h4>
          <p className="text-sm text-foreground-secondary">{children}</p>
        </div>
      </div>
    </div>
  );
}

export default function AgentsDocsPage(): React.ReactElement {
  const [activeSection, setActiveSection] = useState('overview');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: '-100px 0px -66%' }
    );

    NAV_SECTIONS.forEach((section) => {
      section.items.forEach((item) => {
        const element = document.getElementById(item.id);
        if (element) observer.observe(element);
      });
    });

    return () => observer.disconnect();
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setMobileNavOpen(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader />

      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Mobile Navigation Toggle */}
        <div className="lg:hidden sticky top-0 z-30 bg-background border-b border-border px-4 py-3">
          <button
            type="button"
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
            className="flex items-center gap-2 text-sm font-medium text-foreground"
          >
            <span className="text-lg">{mobileNavOpen ? '✕' : '☰'}</span>
            <span>Agents Documentation</span>
          </button>
          {mobileNavOpen && (
            <div className="absolute left-0 right-0 top-full bg-background border-b border-border shadow-lg max-h-[70vh] overflow-y-auto px-4 py-4">
              <SidebarNav activeSection={activeSection} onSectionClick={scrollToSection} />
            </div>
          )}
        </div>

        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-64 flex-shrink-0 border-r border-border bg-surface/50">
          <div className="sticky top-0 h-screen overflow-y-auto py-8 px-4">
            <div className="mb-6">
              <Link
                href="/docs"
                className="text-sm text-foreground-secondary hover:text-foreground mb-2 block"
              >
                ← Back to Docs
              </Link>
              <h2 className="text-lg font-bold text-foreground">AI Agents</h2>
              <p className="text-sm text-foreground-tertiary">Build custom AI assistants</p>
            </div>
            <SidebarNav activeSection={activeSection} onSectionClick={scrollToSection} />
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
            {/* Hero */}
            <div className="mb-12">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 text-foreground">
                AI Agents Documentation
              </h1>
              <p className="text-xl text-foreground-secondary mb-6">
                Create custom AI assistants with multi-provider support, tool integration, and
                persistent conversations.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="/dashboard/agents">
                  <Button variant="default" size="sm">
                    Go to Agents Dashboard
                  </Button>
                </Link>
                <Link href="/dashboard/settings/api-keys">
                  <Button variant="outline" size="sm">
                    Configure API Keys
                  </Button>
                </Link>
              </div>
            </div>

            {/* ==================== GETTING STARTED ==================== */}
            <DocSection id="overview" title="Overview">
              <p className="text-foreground-secondary mb-6">
                TPMJS Agents let you create custom AI assistants powered by any LLM provider. Build
                agents with custom system prompts, attach tools from the registry, and have
                persistent conversations through a streaming API.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <InfoCard icon="🤖" title="Multi-Provider">
                  Support for OpenAI, Anthropic, Google, Groq, and Mistral - bring your own API keys
                </InfoCard>
                <InfoCard icon="🔧" title="Tool Integration">
                  Attach individual tools or entire collections to give your agent capabilities
                </InfoCard>
                <InfoCard icon="💬" title="Persistent Conversations">
                  Full conversation history with streaming responses and tool call visualization
                </InfoCard>
              </div>
              <p className="text-foreground-secondary">
                Agents are user-owned and require authentication. Each agent gets a unique UID that
                can be used in API calls.
              </p>
            </DocSection>

            <DocSection id="api-keys" title="API Keys Setup">
              <p className="text-foreground-secondary mb-6">
                Before creating agents, you need to add your AI provider API keys. Keys are
                encrypted using AES-256 and stored securely.
              </p>
              <DocSubSection title="1. Navigate to API Keys Settings">
                <p className="text-foreground-secondary mb-4">
                  Go to{' '}
                  <Link
                    href="/dashboard/settings/api-keys"
                    className="text-primary hover:underline"
                  >
                    Dashboard → Settings → API Keys
                  </Link>{' '}
                  to manage your provider keys.
                </p>
              </DocSubSection>
              <DocSubSection title="2. Add Your Provider Keys">
                <p className="text-foreground-secondary mb-4">
                  Click &quot;Add Key&quot; for each provider you want to use:
                </p>
                <div className="space-y-3">
                  <div className="p-3 border border-border rounded-lg bg-surface">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-foreground">OpenAI</span>
                    </div>
                    <p className="text-sm text-foreground-secondary">
                      GPT-4o, GPT-4 Turbo, GPT-3.5 Turbo -{' '}
                      <a
                        href="https://platform.openai.com/api-keys"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        Get key
                      </a>
                    </p>
                  </div>
                  <div className="p-3 border border-border rounded-lg bg-surface">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-foreground">Anthropic</span>
                    </div>
                    <p className="text-sm text-foreground-secondary">
                      Claude 3.5 Sonnet, Claude 3 Opus, Claude 3.5 Haiku -{' '}
                      <a
                        href="https://console.anthropic.com/settings/keys"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        Get key
                      </a>
                    </p>
                  </div>
                  <div className="p-3 border border-border rounded-lg bg-surface">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-foreground">Google</span>
                    </div>
                    <p className="text-sm text-foreground-secondary">
                      Gemini 2.0 Flash, Gemini 1.5 Pro -{' '}
                      <a
                        href="https://aistudio.google.com/apikey"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        Get key
                      </a>
                    </p>
                  </div>
                  <div className="p-3 border border-border rounded-lg bg-surface">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-foreground">Groq</span>
                    </div>
                    <p className="text-sm text-foreground-secondary">
                      Llama 3.3 70B, Llama 3.1 8B, Mixtral 8x7B -{' '}
                      <a
                        href="https://console.groq.com/keys"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        Get key
                      </a>
                    </p>
                  </div>
                  <div className="p-3 border border-border rounded-lg bg-surface">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-foreground">Mistral</span>
                    </div>
                    <p className="text-sm text-foreground-secondary">
                      Mistral Large, Mistral Small -{' '}
                      <a
                        href="https://console.mistral.ai/api-keys"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        Get key
                      </a>
                    </p>
                  </div>
                </div>
              </DocSubSection>
              <DocSubSection title="Security">
                <div className="p-4 border border-primary/30 rounded-lg bg-primary/5">
                  <p className="text-sm text-foreground-secondary">
                    <strong className="text-foreground">🔐 Encryption:</strong> Your API keys are
                    encrypted using AES-256-GCM before being stored. Only you can use your keys, and
                    they&apos;re never exposed in API responses - only a hint of the last 4
                    characters is shown.
                  </p>
                </div>
              </DocSubSection>
            </DocSection>

            <DocSection id="creating-agents" title="Creating Agents">
              <p className="text-foreground-secondary mb-6">
                Create an agent to customize its behavior with a system prompt, choose the AI model,
                and configure execution parameters.
              </p>
              <DocSubSection title="Basic Information">
                <ParamTable
                  params={[
                    {
                      name: 'Name',
                      type: 'string',
                      required: true,
                      description: 'Display name for your agent (max 100 chars)',
                    },
                    {
                      name: 'UID',
                      type: 'string',
                      required: false,
                      description:
                        'URL-friendly identifier (auto-generated from name). Used in API calls.',
                    },
                    {
                      name: 'Description',
                      type: 'string',
                      required: false,
                      description: 'Brief description of what the agent does (max 500 chars)',
                    },
                  ]}
                />
              </DocSubSection>
              <DocSubSection title="Model Configuration">
                <ParamTable
                  params={[
                    {
                      name: 'Provider',
                      type: 'enum',
                      required: true,
                      description: 'AI provider (OpenAI, Anthropic, Google, Groq, Mistral)',
                    },
                    {
                      name: 'Model',
                      type: 'string',
                      required: true,
                      description: 'Specific model ID (e.g., gpt-4o, claude-sonnet-4-20250514)',
                    },
                    {
                      name: 'System Prompt',
                      type: 'string',
                      required: false,
                      description:
                        'Instructions that define how the agent behaves (max 10,000 chars)',
                    },
                    {
                      name: 'Temperature',
                      type: 'number',
                      required: false,
                      description:
                        'Response randomness (0 = deterministic, 2 = creative). Default: 0.7',
                    },
                  ]}
                />
              </DocSubSection>
              <DocSubSection title="Execution Limits">
                <ParamTable
                  params={[
                    {
                      name: 'Max Tool Calls',
                      type: 'number',
                      required: false,
                      description:
                        'Maximum tool calls per response turn. Prevents runaway loops. Default: 20',
                    },
                    {
                      name: 'Context Messages',
                      type: 'number',
                      required: false,
                      description:
                        'Number of recent messages included in context window. Default: 10',
                    },
                  ]}
                />
              </DocSubSection>
              <DocSubSection title="Example System Prompt">
                <CodeBlock
                  language="text"
                  code={`You are a helpful research assistant specializing in web scraping and data analysis.

When asked to research a topic:
1. Use available web scraping tools to gather information
2. Analyze and synthesize the data
3. Present findings in a clear, structured format

Always cite your sources and be transparent about limitations.`}
                />
              </DocSubSection>
            </DocSection>

            {/* ==================== FEATURES ==================== */}
            <DocSection id="attaching-tools" title="Attaching Tools">
              <p className="text-foreground-secondary mb-6">
                Give your agent capabilities by attaching tools from the TPMJS registry. You can
                attach individual tools or entire collections.
              </p>
              <DocSubSection title="Adding Individual Tools">
                <p className="text-foreground-secondary mb-4">
                  From your agent&apos;s detail page, use the &quot;Add Tool&quot; button to search
                  and attach specific tools from the registry. Each tool appears with its name,
                  description, and any required environment variables.
                </p>
                <CodeBlock
                  language="text"
                  code={`Example tools you might attach:
- @firecrawl/ai-sdk::scrapeTool - Web scraping
- @exalabs/ai-sdk::webSearch - Web search
- @tpmjs/hello::helloWorldTool - Simple test tool`}
                />
              </DocSubSection>
              <DocSubSection title="Adding Collections">
                <p className="text-foreground-secondary mb-4">
                  Collections let you attach multiple related tools at once. If you&apos;ve created
                  MCP collections, you can attach the entire collection to your agent.
                </p>
              </DocSubSection>
              <DocSubSection title="Tool Order">
                <p className="text-foreground-secondary">
                  Tools are presented to the AI model in the order they appear. You can drag to
                  reorder tools to prioritize certain capabilities.
                </p>
              </DocSubSection>
              <DocSubSection title="Required API Keys">
                <div className="p-4 border border-border rounded-lg bg-surface">
                  <p className="text-sm text-foreground-secondary">
                    <strong className="text-foreground">Note:</strong> Some tools require API keys
                    (e.g., Firecrawl, Exa). You&apos;ll need to add these keys in your API Keys
                    settings. The required environment variables are shown on each tool&apos;s card.
                  </p>
                </div>
              </DocSubSection>
            </DocSection>

            <DocSection id="chat-interface" title="Chat Interface">
              <p className="text-foreground-secondary mb-6">
                Interact with your agents through the built-in chat interface with streaming
                responses and tool call visualization.
              </p>
              <DocSubSection title="Starting a Conversation">
                <p className="text-foreground-secondary mb-4">
                  Click &quot;Chat with Agent&quot; from your agent&apos;s detail page or navigate
                  directly to{' '}
                  <code className="text-primary bg-surface px-1.5 py-0.5 rounded">
                    /dashboard/agents/[id]/chat
                  </code>
                  .
                </p>
              </DocSubSection>
              <DocSubSection title="Features">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InfoCard icon="💬" title="Conversation History">
                    Previous conversations appear in the sidebar. Click to resume any conversation.
                  </InfoCard>
                  <InfoCard icon="⚡" title="Streaming Responses">
                    Responses stream in real-time as the AI generates them.
                  </InfoCard>
                  <InfoCard icon="🔧" title="Tool Calls">
                    When the agent uses a tool, you&apos;ll see the tool name and can expand to view
                    parameters.
                  </InfoCard>
                  <InfoCard icon="📊" title="Token Usage">
                    Token counts are tracked and displayed for monitoring usage.
                  </InfoCard>
                </div>
              </DocSubSection>
              <DocSubSection title="Keyboard Shortcuts">
                <div className="space-y-2 text-foreground-secondary text-sm">
                  <p>
                    <code className="text-primary bg-surface px-1.5 py-0.5 rounded">Enter</code> -
                    Send message
                  </p>
                  <p>
                    <code className="text-primary bg-surface px-1.5 py-0.5 rounded">
                      Shift + Enter
                    </code>{' '}
                    - New line
                  </p>
                </div>
              </DocSubSection>
            </DocSection>

            <DocSection id="providers" title="Supported Providers">
              <p className="text-foreground-secondary mb-6">
                TPMJS Agents support multiple AI providers. Each provider offers different models
                with varying capabilities and pricing.
              </p>
              <div className="space-y-4">
                <div className="p-4 border border-border rounded-lg bg-surface">
                  <h4 className="font-semibold text-foreground mb-2">OpenAI</h4>
                  <p className="text-sm text-foreground-secondary mb-2">
                    Industry-leading models with excellent tool use support.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" size="sm">
                      gpt-4o
                    </Badge>
                    <Badge variant="secondary" size="sm">
                      gpt-4o-mini
                    </Badge>
                    <Badge variant="secondary" size="sm">
                      gpt-4-turbo
                    </Badge>
                    <Badge variant="secondary" size="sm">
                      gpt-3.5-turbo
                    </Badge>
                  </div>
                </div>
                <div className="p-4 border border-border rounded-lg bg-surface">
                  <h4 className="font-semibold text-foreground mb-2">Anthropic</h4>
                  <p className="text-sm text-foreground-secondary mb-2">
                    Claude models known for nuanced understanding and safety.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" size="sm">
                      claude-sonnet-4-20250514
                    </Badge>
                    <Badge variant="secondary" size="sm">
                      claude-3-5-haiku-20241022
                    </Badge>
                    <Badge variant="secondary" size="sm">
                      claude-3-opus-20240229
                    </Badge>
                  </div>
                </div>
                <div className="p-4 border border-border rounded-lg bg-surface">
                  <h4 className="font-semibold text-foreground mb-2">Google</h4>
                  <p className="text-sm text-foreground-secondary mb-2">
                    Gemini models with multimodal capabilities.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" size="sm">
                      gemini-2.0-flash-exp
                    </Badge>
                    <Badge variant="secondary" size="sm">
                      gemini-1.5-pro
                    </Badge>
                    <Badge variant="secondary" size="sm">
                      gemini-1.5-flash
                    </Badge>
                  </div>
                </div>
                <div className="p-4 border border-border rounded-lg bg-surface">
                  <h4 className="font-semibold text-foreground mb-2">Groq</h4>
                  <p className="text-sm text-foreground-secondary mb-2">
                    Ultra-fast inference for open-source models.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" size="sm">
                      llama-3.3-70b-versatile
                    </Badge>
                    <Badge variant="secondary" size="sm">
                      llama-3.1-8b-instant
                    </Badge>
                    <Badge variant="secondary" size="sm">
                      mixtral-8x7b-32768
                    </Badge>
                  </div>
                </div>
                <div className="p-4 border border-border rounded-lg bg-surface">
                  <h4 className="font-semibold text-foreground mb-2">Mistral</h4>
                  <p className="text-sm text-foreground-secondary mb-2">
                    European AI models with strong multilingual support.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" size="sm">
                      mistral-large-latest
                    </Badge>
                    <Badge variant="secondary" size="sm">
                      mistral-small-latest
                    </Badge>
                  </div>
                </div>
              </div>
            </DocSection>

            {/* ==================== API REFERENCE ==================== */}
            <DocSection id="conversation-api" title="Conversation API">
              <p className="text-foreground-secondary mb-6">
                Integrate agent conversations into your own applications using the streaming API.
              </p>
              <DocSubSection title="Endpoint">
                <CodeBlock
                  language="text"
                  code="POST /api/agents/[uid]/conversation/[conversationId]"
                />
                <div className="mt-4 space-y-2 text-foreground-secondary text-sm">
                  <p>
                    <strong className="text-foreground">uid:</strong> Your agent&apos;s unique
                    identifier
                  </p>
                  <p>
                    <strong className="text-foreground">conversationId:</strong> Unique ID for the
                    conversation (create your own or use a new ID to start a new conversation)
                  </p>
                </div>
              </DocSubSection>
              <DocSubSection title="Request Body">
                <ParamTable
                  params={[
                    {
                      name: 'message',
                      type: 'string',
                      required: true,
                      description: 'The user message to send to the agent',
                    },
                    {
                      name: 'env',
                      type: 'object',
                      required: false,
                      description: 'Additional environment variables for tool execution',
                    },
                  ]}
                />
              </DocSubSection>
              <DocSubSection title="Example: JavaScript Client">
                <CodeBlock
                  language="typescript"
                  code={`const conversationId = 'conv-' + Date.now();

const response = await fetch(
  \`https://tpmjs.com/api/agents/\${agentUid}/conversation/\${conversationId}\`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'Search for AI tools' }),
  }
);

const reader = response.body?.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  const chunk = decoder.decode(value);
  const lines = chunk.split('\\n');

  for (const line of lines) {
    if (line.startsWith('event: ')) {
      const event = line.slice(7);
      console.log('Event:', event);
    }
    if (line.startsWith('data: ')) {
      const data = JSON.parse(line.slice(6));
      console.log('Data:', data);
    }
  }
}`}
                />
              </DocSubSection>
            </DocSection>

            <DocSection id="sse-events" title="SSE Events">
              <p className="text-foreground-secondary mb-6">
                The conversation API uses Server-Sent Events (SSE) for streaming responses.
              </p>
              <div className="space-y-4">
                <div className="p-4 border border-border rounded-lg bg-surface">
                  <code className="text-primary font-mono text-lg">chunk</code>
                  <p className="text-sm text-foreground-secondary mt-2">
                    Streaming text content from the AI response.
                  </p>
                  <CodeBlock language="json" code={`{ "text": "Here is my response..." }`} />
                </div>
                <div className="p-4 border border-border rounded-lg bg-surface">
                  <code className="text-primary font-mono text-lg">tool_call</code>
                  <p className="text-sm text-foreground-secondary mt-2">
                    Indicates the agent is calling a tool.
                  </p>
                  <CodeBlock
                    language="json"
                    code={`{ "toolCallId": "call_abc123", "toolName": "webSearch", "input": { "query": "AI news" } }`}
                  />
                </div>
                <div className="p-4 border border-border rounded-lg bg-surface">
                  <code className="text-primary font-mono text-lg">tool_result</code>
                  <p className="text-sm text-foreground-secondary mt-2">
                    The result returned from a tool execution.
                  </p>
                  <CodeBlock
                    language="json"
                    code={`{ "toolCallId": "call_abc123", "result": { "results": [...] } }`}
                  />
                </div>
                <div className="p-4 border border-border rounded-lg bg-surface">
                  <code className="text-primary font-mono text-lg">complete</code>
                  <p className="text-sm text-foreground-secondary mt-2">
                    Signals the response is complete with token usage.
                  </p>
                  <CodeBlock
                    language="json"
                    code={`{ "conversationId": "conv-123", "inputTokens": 150, "outputTokens": 300 }`}
                  />
                </div>
                <div className="p-4 border border-border rounded-lg bg-surface">
                  <code className="text-primary font-mono text-lg">error</code>
                  <p className="text-sm text-foreground-secondary mt-2">
                    An error occurred during processing.
                  </p>
                  <CodeBlock language="json" code={`{ "message": "Failed to execute tool" }`} />
                </div>
              </div>
            </DocSection>

            <DocSection id="endpoints" title="All Endpoints">
              <p className="text-foreground-secondary mb-6">
                Complete reference of all agent-related API endpoints.
              </p>
              <div className="space-y-6">
                <div className="p-4 border border-border rounded-lg bg-surface">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="success" size="sm">
                      POST
                    </Badge>
                    <code className="text-foreground font-mono">
                      /api/agents/[uid]/conversation/[conversationId]
                    </code>
                  </div>
                  <p className="text-sm text-foreground-secondary">
                    Send a message and stream the AI response via SSE.
                  </p>
                </div>
                <div className="p-4 border border-border rounded-lg bg-surface">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="default" size="sm">
                      GET
                    </Badge>
                    <code className="text-foreground font-mono">
                      /api/agents/[uid]/conversation/[conversationId]
                    </code>
                  </div>
                  <p className="text-sm text-foreground-secondary">
                    Get the full conversation history with all messages.
                  </p>
                </div>
                <div className="p-4 border border-border rounded-lg bg-surface">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="default" size="sm">
                      GET
                    </Badge>
                    <code className="text-foreground font-mono">
                      /api/agents/[uid]/conversations
                    </code>
                  </div>
                  <p className="text-sm text-foreground-secondary">
                    List all conversations for an agent.
                  </p>
                </div>
                <div className="p-4 border border-border rounded-lg bg-surface">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="default" size="sm">
                      GET
                    </Badge>
                    <code className="text-foreground font-mono">/api/agents</code>
                  </div>
                  <p className="text-sm text-foreground-secondary">List all your agents.</p>
                </div>
                <div className="p-4 border border-border rounded-lg bg-surface">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="success" size="sm">
                      POST
                    </Badge>
                    <code className="text-foreground font-mono">/api/agents</code>
                  </div>
                  <p className="text-sm text-foreground-secondary">Create a new agent.</p>
                </div>
                <div className="p-4 border border-border rounded-lg bg-surface">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="default" size="sm">
                      GET
                    </Badge>
                    <code className="text-foreground font-mono">/api/agents/[id]</code>
                  </div>
                  <p className="text-sm text-foreground-secondary">Get agent details by ID.</p>
                </div>
                <div className="p-4 border border-border rounded-lg bg-surface">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="warning" size="sm">
                      PATCH
                    </Badge>
                    <code className="text-foreground font-mono">/api/agents/[id]</code>
                  </div>
                  <p className="text-sm text-foreground-secondary">
                    Update an agent&apos;s configuration.
                  </p>
                </div>
                <div className="p-4 border border-border rounded-lg bg-surface">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="error" size="sm">
                      DELETE
                    </Badge>
                    <code className="text-foreground font-mono">/api/agents/[id]</code>
                  </div>
                  <p className="text-sm text-foreground-secondary">
                    Delete an agent and all its conversations.
                  </p>
                </div>
              </div>
            </DocSection>

            {/* CTA */}
            <section className="text-center py-12 border border-border rounded-lg bg-surface">
              <h2 className="text-2xl font-bold mb-4 text-foreground">Ready to Build?</h2>
              <p className="text-foreground-secondary mb-6 max-w-xl mx-auto">
                Create your first AI agent and start building custom assistants.
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Link href="/dashboard/agents/new">
                  <Button variant="default" size="lg">
                    Create an Agent
                  </Button>
                </Link>
                <Link href="/dashboard/settings/api-keys">
                  <Button variant="outline" size="lg">
                    Configure API Keys
                  </Button>
                </Link>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
