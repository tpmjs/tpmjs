'use client';

import { Badge } from '@tpmjs/ui/Badge/Badge';
import { Button } from '@tpmjs/ui/Button/Button';
import { CodeBlock } from '@tpmjs/ui/CodeBlock/CodeBlock';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AppHeader } from '~/components/AppHeader';

const NAV_SECTIONS = [
  {
    title: 'URLs',
    items: [
      { id: 'overview', label: 'Overview' },
      { id: 'user-profiles', label: 'User Profiles' },
      { id: 'agents', label: 'Agents' },
      { id: 'collections', label: 'Collections' },
      { id: 'tools', label: 'Tools' },
    ],
  },
  {
    title: 'Cloning',
    items: [
      { id: 'clone-agents', label: 'Clone Agents' },
      { id: 'clone-collections', label: 'Clone Collections' },
    ],
  },
  {
    title: 'Reference',
    items: [
      { id: 'url-reference', label: 'URL Reference' },
      { id: 'visibility', label: 'Visibility Settings' },
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

function UrlExample({
  url,
  description,
  example,
}: {
  url: string;
  description: string;
  example?: string;
}) {
  return (
    <div className="p-4 border border-border rounded-lg bg-surface mb-3">
      <code className="text-primary font-mono text-sm block mb-2">{url}</code>
      <p className="text-sm text-foreground-secondary">{description}</p>
      {example && (
        <p className="text-xs text-foreground-tertiary mt-2">
          Example: <code className="text-primary">{example}</code>
        </p>
      )}
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

export default function SharingDocsPage(): React.ReactElement {
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
            <span>Sharing & URLs</span>
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
              <h2 className="text-lg font-bold text-foreground">Sharing & URLs</h2>
              <p className="text-sm text-foreground-tertiary">Share your work with others</p>
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
                Sharing & URLs
              </h1>
              <p className="text-xl text-foreground-secondary mb-6">
                Learn how to share your agents, collections, and profile with others using
                human-readable URLs.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="/dashboard/settings">
                  <Button variant="default" size="sm">
                    Edit Your Profile
                  </Button>
                </Link>
                <Link href="/dashboard/agents">
                  <Button variant="outline" size="sm">
                    Manage Agents
                  </Button>
                </Link>
              </div>
            </div>

            {/* ==================== URLS ==================== */}
            <DocSection id="overview" title="Overview">
              <p className="text-foreground-secondary mb-6">
                TPMJS uses human-readable URLs based on your username. When you create an account,
                you choose a unique username that becomes part of your shareable URLs.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <InfoCard icon="👤" title="User Profiles">
                  Share your profile page showing all your public agents and collections
                </InfoCard>
                <InfoCard icon="🤖" title="Agents">
                  Share individual agents so others can chat with them or clone them
                </InfoCard>
                <InfoCard icon="📦" title="Collections">
                  Share tool collections for easy MCP server setup
                </InfoCard>
              </div>
              <div className="p-4 border border-primary/30 rounded-lg bg-primary/5">
                <p className="text-sm text-foreground-secondary">
                  <strong className="text-foreground">Note:</strong> Only public agents and
                  collections are visible to others. You can control visibility in the settings for
                  each item.
                </p>
              </div>
            </DocSection>

            <DocSection id="user-profiles" title="User Profiles">
              <p className="text-foreground-secondary mb-6">
                Your profile page displays your name, avatar, and all your public agents and
                collections.
              </p>
              <DocSubSection title="Profile URL">
                <UrlExample
                  url="tpmjs.com/{username}"
                  description="Your public profile page. Shows all your public agents and collections."
                  example="tpmjs.com/ajax"
                />
                <p className="text-foreground-secondary mb-4">
                  You can also use the @ prefix for social-media style URLs:
                </p>
                <UrlExample
                  url="tpmjs.com/@{username}"
                  description="Alternative format with @ prefix. Works identically to the version without @."
                  example="tpmjs.com/@ajax"
                />
              </DocSubSection>
              <DocSubSection title="Choosing a Username">
                <p className="text-foreground-secondary mb-4">
                  Usernames must be 3-30 characters and can contain lowercase letters, numbers, and
                  hyphens. They cannot start or end with a hyphen.
                </p>
                <CodeBlock
                  language="text"
                  code={`Valid usernames:
- ajax
- john-doe
- dev123
- my-cool-name

Invalid usernames:
- -invalid (starts with hyphen)
- also-invalid- (ends with hyphen)
- Hi (uppercase not allowed)
- ab (too short)`}
                />
              </DocSubSection>
            </DocSection>

            <DocSection id="agents" title="Agents">
              <p className="text-foreground-secondary mb-6">
                Share your AI agents so others can interact with them or clone them to their own
                account.
              </p>
              <DocSubSection title="Agent Detail Page">
                <UrlExample
                  url="tpmjs.com/{username}/agents/{agent-uid}"
                  description="View an agent's details including its system prompt, attached tools, and model configuration."
                  example="tpmjs.com/ajax/agents/research-assistant"
                />
                <p className="text-foreground-secondary">
                  The agent UID is auto-generated from the agent name when you create it. For
                  example, an agent named &quot;Research Assistant&quot; gets the UID
                  &quot;research-assistant&quot;.
                </p>
              </DocSubSection>
              <DocSubSection title="Chat with Agent">
                <UrlExample
                  url="tpmjs.com/{username}/agents/{agent-uid}/chat"
                  description="Open a chat interface to interact with the agent directly."
                  example="tpmjs.com/ajax/agents/research-assistant/chat"
                />
                <div className="p-4 border border-border rounded-lg bg-surface mt-4">
                  <p className="text-sm text-foreground-secondary">
                    <strong className="text-foreground">Note:</strong> Chatting with someone
                    else&apos;s agent uses their API keys and tool configuration. The agent owner is
                    responsible for any API usage costs.
                  </p>
                </div>
              </DocSubSection>
            </DocSection>

            <DocSection id="collections" title="Collections">
              <p className="text-foreground-secondary mb-6">
                Collections bundle multiple tools together for easy sharing and MCP server setup.
              </p>
              <DocSubSection title="Collection Page">
                <UrlExample
                  url="tpmjs.com/{username}/collections/{collection-slug}"
                  description="View a collection with all its tools and MCP server URLs."
                  example="tpmjs.com/ajax/collections/web-scraping-tools"
                />
                <p className="text-foreground-secondary">
                  Collection pages include ready-to-use MCP server URLs that others can copy into
                  their Claude Desktop or Cursor configuration.
                </p>
              </DocSubSection>
              <DocSubSection title="MCP Server URLs">
                <p className="text-foreground-secondary mb-4">
                  Each collection provides HTTP and SSE transport URLs:
                </p>
                <CodeBlock
                  language="json"
                  code={`{
  "mcpServers": {
    "tpmjs-collection": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "https://tpmjs.com/api/collections/{collection-id}/mcp/http"
      ]
    }
  }
}`}
                />
              </DocSubSection>
            </DocSection>

            <DocSection id="tools" title="Tools">
              <p className="text-foreground-secondary mb-6">
                Tools in the registry have URLs based on their npm package name and tool name.
              </p>
              <DocSubSection title="Tool Page">
                <UrlExample
                  url="tpmjs.com/tool/{package-name}/{tool-name}"
                  description="View a tool's documentation, parameters, and usage examples."
                  example="tpmjs.com/tool/@anthropic-ai/mcp-fetch/fetch"
                />
                <p className="text-foreground-secondary">
                  Tools are not user-owned - they come from npm packages published with the{' '}
                  <code className="text-primary bg-surface px-1.5 py-0.5 rounded">tpmjs</code>{' '}
                  keyword.
                </p>
              </DocSubSection>
            </DocSection>

            {/* ==================== CLONING ==================== */}
            <DocSection id="clone-agents" title="Clone Agents">
              <p className="text-foreground-secondary mb-6">
                When you find a public agent you like, you can clone it to your own account to
                customize it.
              </p>
              <DocSubSection title="How to Clone">
                <div className="space-y-4 text-foreground-secondary">
                  <p>
                    1. Navigate to a public agent&apos;s detail page (e.g.,{' '}
                    <code className="text-primary bg-surface px-1.5 py-0.5 rounded">
                      tpmjs.com/ajax/agents/research-assistant
                    </code>
                    )
                  </p>
                  <p>
                    2. Click the <strong className="text-foreground">&quot;Clone&quot;</strong>{' '}
                    button in the header
                  </p>
                  <p>3. The agent is copied to your account with all its tools and settings</p>
                  <p>
                    4. You&apos;ll be redirected to your dashboard where you can customize the
                    cloned agent
                  </p>
                </div>
              </DocSubSection>
              <DocSubSection title="What Gets Cloned">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border border-border rounded-lg bg-surface">
                    <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                      <Badge variant="success" size="sm">
                        Included
                      </Badge>
                    </h4>
                    <ul className="text-sm text-foreground-secondary space-y-1">
                      <li>• Name and description</li>
                      <li>• System prompt</li>
                      <li>• Provider and model settings</li>
                      <li>• Temperature and other parameters</li>
                      <li>• All attached tools</li>
                      <li>• All attached collections</li>
                    </ul>
                  </div>
                  <div className="p-4 border border-border rounded-lg bg-surface">
                    <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                      <Badge variant="secondary" size="sm">
                        Not Included
                      </Badge>
                    </h4>
                    <ul className="text-sm text-foreground-secondary space-y-1">
                      <li>• Conversation history</li>
                      <li>• API keys (you use your own)</li>
                      <li>• Like count</li>
                      <li>• Original owner attribution</li>
                    </ul>
                  </div>
                </div>
              </DocSubSection>
            </DocSection>

            <DocSection id="clone-collections" title="Clone Collections">
              <p className="text-foreground-secondary mb-6">
                Clone collections to get a copy you can modify without affecting the original.
              </p>
              <DocSubSection title="How to Clone">
                <div className="space-y-4 text-foreground-secondary">
                  <p>
                    1. Navigate to a public collection&apos;s detail page (e.g.,{' '}
                    <code className="text-primary bg-surface px-1.5 py-0.5 rounded">
                      tpmjs.com/ajax/collections/web-scraping
                    </code>
                    )
                  </p>
                  <p>
                    2. Click the <strong className="text-foreground">&quot;Clone&quot;</strong>{' '}
                    button
                  </p>
                  <p>3. The collection is copied to your account with all its tools</p>
                  <p>4. You can then add, remove, or reorder tools as you like</p>
                </div>
              </DocSubSection>
              <DocSubSection title="What Gets Cloned">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border border-border rounded-lg bg-surface">
                    <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                      <Badge variant="success" size="sm">
                        Included
                      </Badge>
                    </h4>
                    <ul className="text-sm text-foreground-secondary space-y-1">
                      <li>• Name and description</li>
                      <li>• All tools in the collection</li>
                      <li>• Tool order</li>
                      <li>• Tool notes</li>
                    </ul>
                  </div>
                  <div className="p-4 border border-border rounded-lg bg-surface">
                    <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                      <Badge variant="secondary" size="sm">
                        Not Included
                      </Badge>
                    </h4>
                    <ul className="text-sm text-foreground-secondary space-y-1">
                      <li>• Like count</li>
                      <li>• Original owner attribution</li>
                      <li>• MCP server URLs (new ones generated)</li>
                    </ul>
                  </div>
                </div>
              </DocSubSection>
            </DocSection>

            {/* ==================== REFERENCE ==================== */}
            <DocSection id="url-reference" title="URL Reference">
              <p className="text-foreground-secondary mb-6">
                Complete reference of all shareable URLs on TPMJS.
              </p>
              <div className="overflow-x-auto border border-border rounded-lg">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-surface">
                      <th className="text-left py-3 px-4 text-foreground font-medium">Type</th>
                      <th className="text-left py-3 px-4 text-foreground font-medium">
                        URL Pattern
                      </th>
                      <th className="text-left py-3 px-4 text-foreground font-medium">Example</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-border">
                      <td className="py-3 px-4 text-foreground">User Profile</td>
                      <td className="py-3 px-4 font-mono text-primary text-xs">/{'{username}'}</td>
                      <td className="py-3 px-4 font-mono text-foreground-secondary text-xs">
                        /ajax
                      </td>
                    </tr>
                    <tr className="border-b border-border">
                      <td className="py-3 px-4 text-foreground">User Profile (@)</td>
                      <td className="py-3 px-4 font-mono text-primary text-xs">/@{'{username}'}</td>
                      <td className="py-3 px-4 font-mono text-foreground-secondary text-xs">
                        /@ajax
                      </td>
                    </tr>
                    <tr className="border-b border-border">
                      <td className="py-3 px-4 text-foreground">Agent Detail</td>
                      <td className="py-3 px-4 font-mono text-primary text-xs">
                        /{'{username}'}/agents/{'{uid}'}
                      </td>
                      <td className="py-3 px-4 font-mono text-foreground-secondary text-xs">
                        /ajax/agents/research-bot
                      </td>
                    </tr>
                    <tr className="border-b border-border">
                      <td className="py-3 px-4 text-foreground">Agent Chat</td>
                      <td className="py-3 px-4 font-mono text-primary text-xs">
                        /{'{username}'}/agents/{'{uid}'}/chat
                      </td>
                      <td className="py-3 px-4 font-mono text-foreground-secondary text-xs">
                        /ajax/agents/research-bot/chat
                      </td>
                    </tr>
                    <tr className="border-b border-border">
                      <td className="py-3 px-4 text-foreground">Collection</td>
                      <td className="py-3 px-4 font-mono text-primary text-xs">
                        /{'{username}'}/collections/{'{slug}'}
                      </td>
                      <td className="py-3 px-4 font-mono text-foreground-secondary text-xs">
                        /ajax/collections/web-tools
                      </td>
                    </tr>
                    <tr className="border-b border-border">
                      <td className="py-3 px-4 text-foreground">Tool</td>
                      <td className="py-3 px-4 font-mono text-primary text-xs">
                        /tool/{'{package}'}/{'{tool}'}
                      </td>
                      <td className="py-3 px-4 font-mono text-foreground-secondary text-xs">
                        /tool/@firecrawl/ai-sdk/scrape
                      </td>
                    </tr>
                    <tr className="border-b border-border bg-surface/50">
                      <td className="py-3 px-4 text-foreground" colSpan={3}>
                        <strong className="text-foreground-secondary">API Endpoints</strong>
                      </td>
                    </tr>
                    <tr className="border-b border-border">
                      <td className="py-3 px-4 text-foreground">MCP Server (HTTP)</td>
                      <td className="py-3 px-4 font-mono text-primary text-xs">
                        /api/mcp/{'{username}'}/{'{slug}'}/http
                      </td>
                      <td className="py-3 px-4 font-mono text-foreground-secondary text-xs">
                        /api/mcp/ajax/web-tools/http
                      </td>
                    </tr>
                    <tr className="border-b border-border">
                      <td className="py-3 px-4 text-foreground">MCP Server (SSE)</td>
                      <td className="py-3 px-4 font-mono text-primary text-xs">
                        /api/mcp/{'{username}'}/{'{slug}'}/sse
                      </td>
                      <td className="py-3 px-4 font-mono text-foreground-secondary text-xs">
                        /api/mcp/ajax/web-tools/sse
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 text-foreground">Agent Conversation</td>
                      <td className="py-3 px-4 font-mono text-primary text-xs">
                        /api/chat/{'{username}'}/{'{uid}'}/conversation/{'{id}'}
                      </td>
                      <td className="py-3 px-4 font-mono text-foreground-secondary text-xs">
                        /api/chat/ajax/research-bot/conversation/abc123
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </DocSection>

            <DocSection id="visibility" title="Visibility Settings">
              <p className="text-foreground-secondary mb-6">
                Control who can see your agents and collections.
              </p>
              <DocSubSection title="Public vs Private">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border border-border rounded-lg bg-surface">
                    <h4 className="font-semibold text-foreground mb-2">Public</h4>
                    <ul className="text-sm text-foreground-secondary space-y-1">
                      <li>• Visible on your profile page</li>
                      <li>• Anyone can view the detail page</li>
                      <li>• Can be cloned by other users</li>
                      <li>• Shows up in search results</li>
                      <li>• Others can chat with public agents</li>
                    </ul>
                  </div>
                  <div className="p-4 border border-border rounded-lg bg-surface">
                    <h4 className="font-semibold text-foreground mb-2">Private</h4>
                    <ul className="text-sm text-foreground-secondary space-y-1">
                      <li>• Only visible to you</li>
                      <li>• Not shown on profile</li>
                      <li>• Cannot be cloned</li>
                      <li>• Direct URL returns 404 for others</li>
                      <li>• Only you can chat with the agent</li>
                    </ul>
                  </div>
                </div>
              </DocSubSection>
              <DocSubSection title="Changing Visibility">
                <p className="text-foreground-secondary mb-4">
                  To change an item&apos;s visibility:
                </p>
                <div className="space-y-3 text-foreground-secondary">
                  <p>
                    1. Go to your dashboard (<strong>Dashboard → Agents</strong> or{' '}
                    <strong>Dashboard → Collections</strong>)
                  </p>
                  <p>2. Click on the item you want to modify</p>
                  <p>
                    3. Toggle the <strong>&quot;Public&quot;</strong> switch
                  </p>
                  <p>4. Changes take effect immediately</p>
                </div>
              </DocSubSection>
            </DocSection>

            {/* CTA */}
            <section className="text-center py-12 border border-border rounded-lg bg-surface">
              <h2 className="text-2xl font-bold mb-4 text-foreground">Start Sharing</h2>
              <p className="text-foreground-secondary mb-6 max-w-xl mx-auto">
                Create public agents and collections to share your work with the community.
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Link href="/dashboard/agents/new">
                  <Button variant="default" size="lg">
                    Create an Agent
                  </Button>
                </Link>
                <Link href="/dashboard/collections/new">
                  <Button variant="outline" size="lg">
                    Create a Collection
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
