'use client';

import type { AIProvider } from '@tpmjs/types/agent';
import { PROVIDER_MODELS, SUPPORTED_PROVIDERS } from '@tpmjs/types/agent';
import type { ExecutorConfig } from '@tpmjs/types/executor';
import { Badge } from '@tpmjs/ui/Badge/Badge';
import { Button } from '@tpmjs/ui/Button/Button';
import { CodeBlock } from '@tpmjs/ui/CodeBlock/CodeBlock';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import { Switch } from '@tpmjs/ui/Switch/Switch';
import {
  Table,
  TableBody,
  TableCell,
  TableEmpty,
  TableHead,
  TableHeader,
  TableRow,
} from '@tpmjs/ui/Table/Table';
import { Tabs } from '@tpmjs/ui/Tabs/Tabs';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { DashboardLayout } from '~/components/dashboard/DashboardLayout';
import { EnvVarsEditor } from '~/components/EnvVarsEditor';
import { ExecutorConfigPanel } from '~/components/ExecutorConfigPanel';

type PageTabId = 'tools' | 'collections' | 'api' | 'env-vars' | 'settings';

const VALID_TABS: PageTabId[] = ['tools', 'collections', 'api', 'env-vars', 'settings'];

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
  isPublic: boolean;
  executorType: string | null;
  executorConfig: { url: string; apiKey?: string } | null;
  envVars: Record<string, string> | null;
  toolCount: number;
  collectionCount: number;
  createdAt: string;
  updatedAt: string;
  user: {
    username: string;
  };
}

interface AgentTool {
  id: string;
  toolId: string;
  tool: {
    id: string;
    name: string;
    npmPackageName: string;
    description: string | null;
  };
}

interface AgentCollection {
  id: string;
  collectionId: string;
  collection: {
    id: string;
    name: string;
    description: string | null;
    toolCount: number;
  };
}

interface SearchTool {
  id: string;
  name: string;
  npmPackageName: string;
  description: string | null;
}

interface SearchCollection {
  id: string;
  name: string;
  description: string | null;
  toolCount: number;
}

const PROVIDER_DISPLAY_NAMES: Record<AIProvider, string> = {
  OPENAI: 'OpenAI',
  ANTHROPIC: 'Anthropic',
  GOOGLE: 'Google',
  GROQ: 'Groq',
  MISTRAL: 'Mistral',
};

const API_SECTION_TABS = [
  { id: 'send', label: 'Send Message' },
  { id: 'fetch', label: 'Fetch Conversations' },
];

const LANG_OPTIONS = [
  { id: 'curl', label: 'cURL' },
  { id: 'typescript', label: 'TypeScript' },
  { id: 'python', label: 'Python' },
  { id: 'aisdk', label: 'AI SDK' },
];

const FETCH_LANG_OPTIONS = [
  { id: 'curl', label: 'cURL' },
  { id: 'typescript', label: 'TypeScript' },
  { id: 'python', label: 'Python' },
];

function ApiDocsSection({ agent, agentTools }: { agent: Agent; agentTools: AgentTool[] }) {
  const [activeSection, setActiveSection] = useState('send');
  const [activeLang, setActiveLang] = useState('curl');
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://tpmjs.com';
  const username = agent.user.username;
  const endpoint = `${baseUrl}/api/${username}/agents/${agent.uid}/conversation/my-conv-1`;
  const listEndpoint = `${baseUrl}/api/${username}/agents/${agent.uid}/conversations`;
  const toolPackages = agentTools.map((t) => t.tool.npmPackageName).join(' ') || '@tpmjs/hello';

  const sendExamples: Record<string, { language: string; code: string }> = {
    curl: {
      language: 'bash',
      code: `curl -X POST '${endpoint}' \\
  -H 'Content-Type: application/json' \\
  -H 'Authorization: Bearer YOUR_TPMJS_API_KEY' \\
  -d '{ "message": "Hello, what can you help me with?" }'`,
    },
    typescript: {
      language: 'typescript',
      code: `const response = await fetch('${endpoint}', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_TPMJS_API_KEY'
  },
  body: JSON.stringify({ message: 'Hello, what can you help me with?' })
});

// Stream SSE response
const reader = response.body?.getReader();
const decoder = new TextDecoder();
while (true) {
  const { done, value } = await reader!.read();
  if (done) break;
  console.log(decoder.decode(value));
}`,
    },
    python: {
      language: 'python',
      code: `import requests

response = requests.post('${endpoint}',
    headers={'Authorization': 'Bearer YOUR_TPMJS_API_KEY'},
    json={'message': 'Hello, what can you help me with?'},
    stream=True)

for line in response.iter_lines():
    if line: print(line.decode('utf-8'))`,
    },
    aisdk: {
      language: 'typescript',
      code: `import { streamText } from 'ai';
import { createAnthropic } from '@ai-sdk/anthropic';

// Option 1: Use hosted agent via fetch
const response = await fetch('${endpoint}', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_TPMJS_API_KEY'
  },
  body: JSON.stringify({ message: 'Hello!' })
});

// Option 2: Build your own with same tools
// npm install ${toolPackages}
const { textStream } = streamText({
  model: createAnthropic()('${agent.modelId}'),
  system: \`${agent.systemPrompt || 'You are a helpful assistant.'}\`,
  prompt: 'Hello!',
});`,
    },
  };

  const fetchExamples: Record<string, { language: string; code: string }> = {
    curl: {
      language: 'bash',
      code: `# List conversations
curl -H 'Authorization: Bearer YOUR_TPMJS_API_KEY' \\
  '${listEndpoint}?limit=20&offset=0'

# Get conversation with messages
curl -H 'Authorization: Bearer YOUR_TPMJS_API_KEY' \\
  '${endpoint}?limit=50&offset=0'

# Delete conversation
curl -X DELETE -H 'Authorization: Bearer YOUR_TPMJS_API_KEY' \\
  '${endpoint}'`,
    },
    typescript: {
      language: 'typescript',
      code: `const headers = { 'Authorization': 'Bearer YOUR_TPMJS_API_KEY' };

// List conversations
const list = await fetch('${listEndpoint}?limit=20&offset=0', { headers });
const { data, pagination } = await list.json();
// data: [{ id, slug, title, messageCount }], pagination: { hasMore }

// Get conversation with messages
const conv = await fetch('${endpoint}?limit=50&offset=0', { headers });
const { data: conversation } = await conv.json();
// conversation: { id, slug, title, messages: [...] }`,
    },
    python: {
      language: 'python',
      code: `import requests

headers = {'Authorization': 'Bearer YOUR_TPMJS_API_KEY'}

# List conversations
resp = requests.get('${listEndpoint}', headers=headers, params={'limit': 20, 'offset': 0})
data = resp.json()  # data['data'], data['pagination']['hasMore']

# Get conversation with messages
resp = requests.get('${endpoint}', headers=headers, params={'limit': 50, 'offset': 0})
conv = resp.json()  # conv['data']['messages']`,
    },
  };

  const isSend = activeSection === 'send';
  const examples = isSend ? sendExamples : fetchExamples;
  const langOptions = isSend ? LANG_OPTIONS : FETCH_LANG_OPTIONS;
  const effectiveLang = isSend || activeLang !== 'aisdk' ? activeLang : 'curl';
  const currentExample = examples[effectiveLang] ?? examples.curl ?? { language: 'bash', code: '' };

  return (
    <div className="bg-surface border border-border rounded-lg overflow-hidden mb-8">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h2 className="text-lg font-medium text-foreground">API Reference</h2>
        <code className="text-xs text-foreground-secondary font-mono bg-surface px-2 py-1 rounded">
          {isSend
            ? `POST /api/${username}/agents/${agent.uid}/conversation/:id`
            : `GET /api/${username}/agents/${agent.uid}/conversations`}
        </code>
      </div>

      <div className="flex items-center justify-between border-b border-border px-4 py-2">
        <Tabs
          tabs={API_SECTION_TABS}
          activeTab={activeSection}
          onTabChange={setActiveSection}
          size="sm"
        />
        <select
          value={effectiveLang}
          onChange={(e) => setActiveLang(e.target.value)}
          className="px-2 py-1 text-sm bg-surface border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          {langOptions.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="p-4">
        <CodeBlock language={currentExample.language} showCopy code={currentExample.code} />
      </div>

      <div className="px-4 pb-4">
        <p className="text-xs text-foreground-tertiary">
          {isSend
            ? 'Use any unique string as the conversation ID to maintain chat history across requests.'
            : 'Use limit and offset query params for pagination. Check hasMore to know if more results exist.'}
        </p>
      </div>
    </div>
  );
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Agent detail page has multiple interconnected features
export default function AgentDetailPage(): React.ReactElement {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const agentId = params.id as string;

  // Get initial tab from URL or default to 'tools'
  const tabFromUrl = searchParams.get('tab') as PageTabId | null;
  const initialTab = tabFromUrl && VALID_TABS.includes(tabFromUrl) ? tabFromUrl : 'tools';

  const [agent, setAgent] = useState<Agent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [executorConfig, setExecutorConfig] = useState<ExecutorConfig | null>(null);
  const [activeTab, setActiveTab] = useState<PageTabId>(initialTab);

  // Update URL when tab changes
  const handleTabChange = (tabId: string) => {
    const newTab = tabId as PageTabId;
    setActiveTab(newTab);
    const newParams = new URLSearchParams(searchParams.toString());
    if (newTab === 'tools') {
      newParams.delete('tab');
    } else {
      newParams.set('tab', newTab);
    }
    const queryString = newParams.toString();
    router.replace(`/dashboard/agents/${agentId}${queryString ? `?${queryString}` : ''}`, {
      scroll: false,
    });
  };

  // Tools state
  const [agentTools, setAgentTools] = useState<AgentTool[]>([]);
  const [toolSearch, setToolSearch] = useState('');
  const [toolSearchResults, setToolSearchResults] = useState<SearchTool[]>([]);
  const [isSearchingTools, setIsSearchingTools] = useState(false);
  const [showToolSearch, setShowToolSearch] = useState(false);
  const toolSearchRef = useRef<HTMLDivElement>(null);

  // Collections state
  const [agentCollections, setAgentCollections] = useState<AgentCollection[]>([]);
  const [collectionSearch, setCollectionSearch] = useState('');
  const [collectionSearchResults, setCollectionSearchResults] = useState<SearchCollection[]>([]);
  const [isSearchingCollections, setIsSearchingCollections] = useState(false);
  const [showCollectionSearch, setShowCollectionSearch] = useState(false);
  const collectionSearchRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    uid: '',
    description: '',
    provider: 'OPENAI' as AIProvider,
    modelId: '',
    systemPrompt: '',
    temperature: 0.7,
    maxToolCallsPerTurn: 20,
    maxMessagesInContext: 10,
    isPublic: true,
  });

  // Environment variables state (stored as object for the EnvVarsEditor component)
  const [envVars, setEnvVars] = useState<Record<string, string> | null>(null);

  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Multiple state initialization from fetched data
  const fetchAgent = useCallback(async () => {
    try {
      const response = await fetch(`/api/agents/${agentId}`);
      const data = await response.json();

      if (data.success) {
        setAgent(data.data);
        setFormData({
          name: data.data.name,
          uid: data.data.uid,
          description: data.data.description || '',
          provider: data.data.provider,
          modelId: data.data.modelId,
          systemPrompt: data.data.systemPrompt || '',
          temperature: data.data.temperature,
          maxToolCallsPerTurn: data.data.maxToolCallsPerTurn,
          maxMessagesInContext: data.data.maxMessagesInContext,
          isPublic: data.data.isPublic,
        });
        // Initialize executor config state from agent data
        if (data.data.executorType === 'custom_url' && data.data.executorConfig) {
          setExecutorConfig({
            type: 'custom_url',
            url: data.data.executorConfig.url,
            apiKey: data.data.executorConfig.apiKey,
          });
        } else {
          setExecutorConfig(data.data.executorType ? { type: 'default' } : null);
        }
        // Initialize env vars from agent data
        if (data.data.envVars && typeof data.data.envVars === 'object') {
          setEnvVars(data.data.envVars as Record<string, string>);
        } else {
          setEnvVars(null);
        }
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
    } finally {
      setIsLoading(false);
    }
  }, [agentId, router]);

  // Fetch tools attached to agent
  const fetchAgentTools = useCallback(async () => {
    try {
      const response = await fetch(`/api/agents/${agentId}/tools`);
      const data = await response.json();
      if (data.success) {
        setAgentTools(data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch agent tools:', err);
    }
  }, [agentId]);

  // Fetch collections attached to agent
  const fetchAgentCollections = useCallback(async () => {
    try {
      const response = await fetch(`/api/agents/${agentId}/collections`);
      const data = await response.json();
      if (data.success) {
        setAgentCollections(data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch agent collections:', err);
    }
  }, [agentId]);

  useEffect(() => {
    fetchAgent();
  }, [fetchAgent]);

  useEffect(() => {
    if (agent) {
      fetchAgentTools();
      fetchAgentCollections();
    }
  }, [agent, fetchAgentTools, fetchAgentCollections]);

  // Click outside handler for search dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (toolSearchRef.current && !toolSearchRef.current.contains(event.target as Node)) {
        setShowToolSearch(false);
      }
      if (
        collectionSearchRef.current &&
        !collectionSearchRef.current.contains(event.target as Node)
      ) {
        setShowCollectionSearch(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search tools
  const searchTools = useCallback(
    async (query: string) => {
      if (!query.trim()) {
        setToolSearchResults([]);
        return;
      }
      setIsSearchingTools(true);
      try {
        const response = await fetch(`/api/tools/search?q=${encodeURIComponent(query)}&limit=10`);
        const data = await response.json();
        if (data.success && data.results?.tools) {
          // Filter out tools already attached and map to expected shape
          const attachedToolIds = new Set(agentTools.map((t) => t.toolId));
          const filtered = data.results.tools
            .filter((t: { id: string }) => !attachedToolIds.has(t.id))
            .map(
              (t: {
                id: string;
                name: string;
                description: string | null;
                package: { npmPackageName: string };
              }) => ({
                id: t.id,
                name: t.name,
                description: t.description,
                npmPackageName: t.package.npmPackageName,
              })
            );
          setToolSearchResults(filtered);
        }
      } catch (err) {
        console.error('Failed to search tools:', err);
      } finally {
        setIsSearchingTools(false);
      }
    },
    [agentTools]
  );

  // Search collections
  const searchCollections = useCallback(
    async (query: string) => {
      if (!query.trim()) {
        setCollectionSearchResults([]);
        return;
      }
      setIsSearchingCollections(true);
      try {
        const response = await fetch(
          `/api/collections?search=${encodeURIComponent(query)}&limit=10`
        );
        const data = await response.json();
        if (data.success) {
          // Filter out collections already attached
          const attachedCollectionIds = new Set(agentCollections.map((c) => c.collectionId));
          const filtered = (data.data || []).filter(
            (c: SearchCollection) => !attachedCollectionIds.has(c.id)
          );
          setCollectionSearchResults(filtered);
        }
      } catch (err) {
        console.error('Failed to search collections:', err);
      } finally {
        setIsSearchingCollections(false);
      }
    },
    [agentCollections]
  );

  // Debounced search effects
  useEffect(() => {
    const timer = setTimeout(() => {
      if (toolSearch) searchTools(toolSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [toolSearch, searchTools]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (collectionSearch) searchCollections(collectionSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [collectionSearch, searchCollections]);

  // Add tool to agent
  const addTool = async (toolId: string) => {
    try {
      const response = await fetch(`/api/agents/${agentId}/tools`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toolId }),
      });
      const data = await response.json();
      if (data.success) {
        await fetchAgentTools();
        await fetchAgent();
        setToolSearch('');
        setToolSearchResults([]);
        setShowToolSearch(false);
      } else {
        alert(data.error || 'Failed to add tool');
      }
    } catch (err) {
      console.error('Failed to add tool:', err);
      alert('Failed to add tool');
    }
  };

  // Remove tool from agent
  const removeTool = async (toolId: string) => {
    try {
      const response = await fetch(`/api/agents/${agentId}/tools/${toolId}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (data.success) {
        await fetchAgentTools();
        await fetchAgent();
      } else {
        alert(data.error || 'Failed to remove tool');
      }
    } catch (err) {
      console.error('Failed to remove tool:', err);
      alert('Failed to remove tool');
    }
  };

  // Add collection to agent
  const addCollection = async (collectionId: string) => {
    try {
      const response = await fetch(`/api/agents/${agentId}/collections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ collectionId }),
      });
      const data = await response.json();
      if (data.success) {
        await fetchAgentCollections();
        await fetchAgent();
        setCollectionSearch('');
        setCollectionSearchResults([]);
        setShowCollectionSearch(false);
      } else {
        alert(data.error || 'Failed to add collection');
      }
    } catch (err) {
      console.error('Failed to add collection:', err);
      alert('Failed to add collection');
    }
  };

  // Remove collection from agent
  const removeCollection = async (collectionId: string) => {
    try {
      const response = await fetch(`/api/agents/${agentId}/collections/${collectionId}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (data.success) {
        await fetchAgentCollections();
        await fetchAgent();
      } else {
        alert(data.error || 'Failed to remove collection');
      }
    } catch (err) {
      console.error('Failed to remove collection:', err);
      alert('Failed to remove collection');
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const newData = { ...prev, [name]: value };

      // Reset model when provider changes
      if (name === 'provider') {
        const provider = value as AIProvider;
        const models = PROVIDER_MODELS[provider];
        newData.modelId = models?.[0]?.id || '';
      }

      return newData;
    });
  };

  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Multiple conditional fields in save payload
  const handleSave = async () => {
    setIsSaving(true);

    // Build update payload including executor config
    const updatePayload: Record<string, unknown> = {
      ...formData,
      temperature: Number.parseFloat(formData.temperature.toString()),
      maxToolCallsPerTurn: Number.parseInt(formData.maxToolCallsPerTurn.toString(), 10),
      maxMessagesInContext: Number.parseInt(formData.maxMessagesInContext.toString(), 10),
      description: formData.description || null,
      systemPrompt: formData.systemPrompt || null,
      isPublic: formData.isPublic,
    };

    // Add executor config
    if (executorConfig) {
      updatePayload.executorType = executorConfig.type;
      if (executorConfig.type === 'custom_url') {
        updatePayload.executorConfig = {
          url: executorConfig.url,
          apiKey: executorConfig.apiKey,
        };
      } else {
        updatePayload.executorConfig = null;
      }
    } else {
      updatePayload.executorType = null;
      updatePayload.executorConfig = null;
    }

    // Add env vars
    updatePayload.envVars = envVars;

    try {
      const response = await fetch(`/api/agents/${agentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatePayload),
      });

      const result = await response.json();

      if (result.success) {
        setAgent(result.data);
      } else {
        throw new Error(result.error || 'Failed to update agent');
      }
    } catch (err) {
      console.error('Failed to update agent:', err);
      alert(err instanceof Error ? err.message : 'Failed to update agent');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this agent? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/agents/${agentId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        router.push('/dashboard/agents');
      } else {
        throw new Error(result.error || 'Failed to delete agent');
      }
    } catch (err) {
      console.error('Failed to delete agent:', err);
      alert(err instanceof Error ? err.message : 'Failed to delete agent');
    }
  };

  const models = PROVIDER_MODELS[formData.provider] || [];

  if (isLoading) {
    return (
      <DashboardLayout title="Loading..." showBackButton backUrl="/dashboard/agents">
        <div className="animate-pulse">
          <div className="h-8 bg-surface-secondary rounded w-48 mb-8" />
          <div className="h-64 bg-surface-secondary rounded-lg" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !agent) {
    return (
      <DashboardLayout title="Error" showBackButton backUrl="/dashboard/agents">
        <div className="text-center py-16">
          <Icon icon="alertCircle" size="lg" className="mx-auto text-error mb-4" />
          <h2 className="text-lg font-medium text-foreground mb-2">Error</h2>
          <p className="text-foreground-secondary mb-4">{error || 'Agent not found'}</p>
          <Link href="/dashboard/agents">
            <Button>Back to Agents</Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const envVarsCount = envVars ? Object.keys(envVars).length : 0;

  const pageTabs = [
    { id: 'tools' as const, label: 'Tools', count: agentTools.length },
    { id: 'collections' as const, label: 'Collections', count: agentCollections.length },
    { id: 'api' as const, label: 'API' },
    {
      id: 'env-vars' as const,
      label: 'Env Vars',
      count: envVarsCount > 0 ? envVarsCount : undefined,
    },
    { id: 'settings' as const, label: 'Settings' },
  ];

  return (
    <DashboardLayout
      title={agent.name}
      subtitle={`${PROVIDER_DISPLAY_NAMES[agent.provider]} / ${agent.modelId}`}
      showBackButton
      backUrl="/dashboard/agents"
      actions={
        <Link href={`/dashboard/agents/${agent.id}/chat`}>
          <Button>
            <Icon icon="message" size="sm" className="mr-2" />
            Chat
          </Button>
        </Link>
      }
    >
      {/* Status badges */}
      <div className="flex items-center gap-2 mb-6">
        <Badge variant={agent.isPublic ? 'success' : 'secondary'}>
          {agent.isPublic ? 'Public' : 'Private'}
        </Badge>
        {executorConfig?.type === 'custom_url' && (
          <Badge variant="secondary">Custom Executor</Badge>
        )}
      </div>

      {/* Tabs */}
      <Tabs tabs={pageTabs} activeTab={activeTab} onTabChange={handleTabChange} className="mb-6" />

      {/* Tools Tab */}
      {activeTab === 'tools' && (
        <div className="bg-surface border border-border rounded-lg overflow-hidden">
          {/* Add Tool Search */}
          <div ref={toolSearchRef} className="relative p-4 border-b border-border">
            <div className="relative">
              <Icon
                icon="search"
                size="xs"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-tertiary"
              />
              <input
                type="text"
                value={toolSearch}
                onChange={(e) => {
                  setToolSearch(e.target.value);
                  setShowToolSearch(true);
                }}
                onFocus={() => setShowToolSearch(true)}
                placeholder="Search tools to add..."
                className="w-full pl-9 pr-3 py-2 bg-surface border border-border rounded-lg text-foreground text-sm placeholder:text-foreground-tertiary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
              />
              {isSearchingTools && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>

            {/* Search Results Dropdown */}
            {showToolSearch && toolSearch && (
              <div className="absolute z-10 left-4 right-4 mt-1 bg-surface border border-border rounded-lg shadow-lg max-h-64 overflow-y-auto">
                {toolSearchResults.length > 0 ? (
                  toolSearchResults.map((tool) => (
                    <button
                      type="button"
                      key={tool.id}
                      onClick={() => addTool(tool.id)}
                      className="w-full px-3 py-2 text-left hover:bg-surface-secondary transition-colors first:rounded-t-lg last:rounded-b-lg"
                    >
                      <p className="text-sm font-medium text-foreground">{tool.name}</p>
                      <p className="text-xs text-foreground-tertiary font-mono">
                        {tool.npmPackageName}
                      </p>
                    </button>
                  ))
                ) : !isSearchingTools ? (
                  <div className="px-3 py-4 text-center text-sm text-foreground-tertiary">
                    No tools found
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {/* Tools Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tool</TableHead>
                <TableHead>Package</TableHead>
                <TableHead className="w-[80px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {agentTools.length === 0 ? (
                <TableEmpty
                  colSpan={3}
                  icon={
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Icon icon="puzzle" size="md" className="text-primary" />
                    </div>
                  }
                  title="No tools attached"
                  description="Search above to add tools to this agent"
                />
              ) : (
                agentTools.map((at) => (
                  <TableRow key={at.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Icon icon="puzzle" size="sm" className="text-primary" />
                        </div>
                        <span className="font-medium text-foreground">{at.tool.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-foreground-secondary font-mono text-sm">
                        {at.tool.npmPackageName}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeTool(at.toolId)}
                          title="Remove tool"
                          className="text-error hover:text-error hover:bg-error/10"
                        >
                          <Icon icon="trash" size="xs" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Collections Tab */}
      {activeTab === 'collections' && (
        <div className="bg-surface border border-border rounded-lg overflow-hidden">
          {/* Add Collection Search */}
          <div ref={collectionSearchRef} className="relative p-4 border-b border-border">
            <div className="relative">
              <Icon
                icon="search"
                size="xs"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-tertiary"
              />
              <input
                type="text"
                value={collectionSearch}
                onChange={(e) => {
                  setCollectionSearch(e.target.value);
                  setShowCollectionSearch(true);
                }}
                onFocus={() => setShowCollectionSearch(true)}
                placeholder="Search collections to add..."
                className="w-full pl-9 pr-3 py-2 bg-surface border border-border rounded-lg text-foreground text-sm placeholder:text-foreground-tertiary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
              />
              {isSearchingCollections && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>

            {/* Search Results Dropdown */}
            {showCollectionSearch && collectionSearch && (
              <div className="absolute z-10 left-4 right-4 mt-1 bg-surface border border-border rounded-lg shadow-lg max-h-64 overflow-y-auto">
                {collectionSearchResults.length > 0 ? (
                  collectionSearchResults.map((collection) => (
                    <button
                      type="button"
                      key={collection.id}
                      onClick={() => addCollection(collection.id)}
                      className="w-full px-3 py-2 text-left hover:bg-surface-secondary transition-colors first:rounded-t-lg last:rounded-b-lg"
                    >
                      <p className="text-sm font-medium text-foreground">{collection.name}</p>
                      <p className="text-xs text-foreground-tertiary">
                        {collection.toolCount} tools
                      </p>
                    </button>
                  ))
                ) : !isSearchingCollections ? (
                  <div className="px-3 py-4 text-center text-sm text-foreground-tertiary">
                    No collections found
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {/* Collections Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Collection</TableHead>
                <TableHead>Tools</TableHead>
                <TableHead className="w-[80px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {agentCollections.length === 0 ? (
                <TableEmpty
                  colSpan={3}
                  icon={
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Icon icon="folder" size="md" className="text-primary" />
                    </div>
                  }
                  title="No collections attached"
                  description="Search above to add collections to this agent"
                />
              ) : (
                agentCollections.map((ac) => (
                  <TableRow key={ac.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Icon icon="folder" size="sm" className="text-primary" />
                        </div>
                        <span className="font-medium text-foreground">{ac.collection.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-foreground-secondary text-sm">
                        {ac.collection.toolCount} tools
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeCollection(ac.collectionId)}
                          title="Remove collection"
                          className="text-error hover:text-error hover:bg-error/10"
                        >
                          <Icon icon="trash" size="xs" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* API Tab */}
      {activeTab === 'api' && <ApiDocsSection agent={agent} agentTools={agentTools} />}

      {/* Env Vars Tab */}
      {activeTab === 'env-vars' && (
        <div className="bg-surface border border-border rounded-lg p-6">
          <EnvVarsEditor
            value={envVars}
            onChange={(newEnvVars) => {
              setEnvVars(newEnvVars);
              // Auto-save env vars
              fetch(`/api/agents/${agentId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ envVars: newEnvVars }),
              });
            }}
            title="Environment Variables"
            description="Passed to tools at runtime. Agent vars override collection vars. Changes are saved automatically."
            disabled={isSaving}
          />
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          {/* Agent Details */}
          <div className="bg-surface border border-border rounded-lg p-6">
            <h3 className="text-lg font-medium text-foreground mb-4">Agent Details</h3>
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-foreground mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                  />
                </div>
                <div>
                  <label htmlFor="uid" className="block text-sm font-medium text-foreground mb-1">
                    UID
                  </label>
                  <input
                    type="text"
                    id="uid"
                    name="uid"
                    value={formData.uid}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-foreground font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-foreground mb-1"
                >
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={2}
                  className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary resize-none"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="provider"
                    className="block text-sm font-medium text-foreground mb-1"
                  >
                    Provider
                  </label>
                  <select
                    id="provider"
                    name="provider"
                    value={formData.provider}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                  >
                    {SUPPORTED_PROVIDERS.map((p) => (
                      <option key={p} value={p}>
                        {PROVIDER_DISPLAY_NAMES[p]}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="modelId"
                    className="block text-sm font-medium text-foreground mb-1"
                  >
                    Model
                  </label>
                  <select
                    id="modelId"
                    name="modelId"
                    value={formData.modelId}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                  >
                    {models.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="systemPrompt"
                  className="block text-sm font-medium text-foreground mb-1"
                >
                  System Prompt
                </label>
                <textarea
                  id="systemPrompt"
                  name="systemPrompt"
                  value={formData.systemPrompt}
                  onChange={handleChange}
                  rows={6}
                  className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-foreground font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary resize-none"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label
                    htmlFor="temperature"
                    className="block text-sm font-medium text-foreground mb-1"
                  >
                    Temperature
                  </label>
                  <input
                    type="number"
                    id="temperature"
                    name="temperature"
                    value={formData.temperature}
                    onChange={handleChange}
                    min={0}
                    max={2}
                    step={0.1}
                    className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                  />
                </div>
                <div>
                  <label
                    htmlFor="maxToolCallsPerTurn"
                    className="block text-sm font-medium text-foreground mb-1"
                  >
                    Max Tool Calls
                  </label>
                  <input
                    type="number"
                    id="maxToolCallsPerTurn"
                    name="maxToolCallsPerTurn"
                    value={formData.maxToolCallsPerTurn}
                    onChange={handleChange}
                    min={1}
                    max={100}
                    className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                  />
                </div>
                <div>
                  <label
                    htmlFor="maxMessagesInContext"
                    className="block text-sm font-medium text-foreground mb-1"
                  >
                    Context Messages
                  </label>
                  <input
                    type="number"
                    id="maxMessagesInContext"
                    name="maxMessagesInContext"
                    value={formData.maxMessagesInContext}
                    onChange={handleChange}
                    min={1}
                    max={100}
                    className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-surface-secondary rounded-lg border border-border">
                <div>
                  <p className="text-sm font-medium text-foreground">Public Visibility</p>
                  <p className="text-xs text-foreground-secondary">
                    Make this agent visible on the public agents page
                  </p>
                </div>
                <Switch
                  checked={formData.isPublic}
                  onChange={(checked) => setFormData((prev) => ({ ...prev, isPublic: checked }))}
                />
              </div>

              <div className="flex justify-end pt-2">
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          </div>

          {/* Executor Configuration */}
          <div className="bg-surface border border-border rounded-lg p-6">
            <ExecutorConfigPanel
              value={executorConfig}
              onChange={setExecutorConfig}
              disabled={isSaving}
            />
          </div>

          {/* Danger Zone */}
          <div className="bg-surface border border-error/30 rounded-lg p-6">
            <h3 className="text-lg font-medium text-error mb-2">Danger Zone</h3>
            <p className="text-sm text-foreground-secondary mb-4">
              Once you delete an agent, there is no going back. Please be certain.
            </p>
            <Button
              variant="outline"
              onClick={handleDelete}
              className="text-error border-error/50 hover:bg-error/10"
            >
              <Icon icon="trash" size="xs" className="mr-1" />
              Delete Agent
            </Button>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
