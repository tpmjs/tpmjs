'use client';

import { Badge } from '@tpmjs/ui/Badge/Badge';
import { Button } from '@tpmjs/ui/Button/Button';
import { CodeBlock } from '@tpmjs/ui/CodeBlock/CodeBlock';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AppHeader } from '~/components/AppHeader';

const NAV_SECTIONS = [
  {
    title: 'Overview',
    items: [
      { id: 'introduction', label: 'Introduction' },
      { id: 'getting-started', label: 'Getting Started' },
    ],
  },
  {
    title: 'User Accounts',
    items: [
      { id: 'accounts-overview', label: 'Overview' },
      { id: 'usernames', label: 'Usernames & Profiles' },
      { id: 'public-pages', label: 'Public Pages' },
    ],
  },
  {
    title: 'Collections',
    items: [
      { id: 'collections-overview', label: 'Overview' },
      { id: 'creating-collections', label: 'Creating Collections' },
      { id: 'collection-tools', label: 'Adding Tools' },
      { id: 'mcp-integration', label: 'MCP Integration' },
      { id: 'collection-env-vars', label: 'Environment Variables' },
    ],
  },
  {
    title: 'Agents',
    items: [
      { id: 'agents-overview', label: 'Overview' },
      { id: 'creating-agents', label: 'Creating Agents' },
      { id: 'agent-tools', label: 'Attaching Tools' },
      { id: 'agent-chat', label: 'Chat Interface' },
      { id: 'agent-providers', label: 'LLM Providers' },
    ],
  },
  {
    title: 'Forking',
    items: [
      { id: 'forking-overview', label: 'Overview' },
      { id: 'fork-agents', label: 'Fork Agents' },
      { id: 'fork-collections', label: 'Fork Collections' },
      { id: 'fork-attribution', label: 'Attribution' },
    ],
  },
  {
    title: 'API Keys',
    items: [
      { id: 'api-keys-overview', label: 'Overview' },
      { id: 'creating-api-keys', label: 'Creating Keys' },
      { id: 'api-scopes', label: 'Scopes & Permissions' },
      { id: 'rate-limits', label: 'Rate Limits' },
      { id: 'api-usage', label: 'Usage Tracking' },
    ],
  },
  {
    title: 'Reference',
    items: [
      { id: 'limits', label: 'Platform Limits' },
      { id: 'urls', label: 'URL Reference' },
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

function LimitTable({
  limits,
}: {
  limits: { resource: string; limit: string; description: string }[];
}) {
  return (
    <div className="overflow-x-auto border border-border rounded-lg">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-surface">
            <th className="text-left py-3 px-4 text-foreground font-medium">Resource</th>
            <th className="text-left py-3 px-4 text-foreground font-medium">Limit</th>
            <th className="text-left py-3 px-4 text-foreground font-medium">Description</th>
          </tr>
        </thead>
        <tbody>
          {limits.map((limit, i) => (
            <tr
              key={limit.resource}
              className={i !== limits.length - 1 ? 'border-b border-border' : ''}
            >
              <td className="py-3 px-4 font-mono text-primary">{limit.resource}</td>
              <td className="py-3 px-4 font-mono text-foreground">{limit.limit}</td>
              <td className="py-3 px-4 text-foreground-secondary">{limit.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function PlatformGuidePage(): React.ReactElement {
  const [activeSection, setActiveSection] = useState('introduction');
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
            <span>Platform Guide</span>
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
              <h2 className="text-lg font-bold text-foreground">Platform Guide</h2>
              <p className="text-sm text-foreground-tertiary">Complete reference</p>
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
                TPMJS Platform Guide
              </h1>
              <p className="text-xl text-foreground-secondary mb-6">
                Complete guide to user accounts, collections, agents, forking, and API keys on
                TPMJS.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="/dashboard">
                  <Button variant="default" size="sm">
                    Go to Dashboard
                  </Button>
                </Link>
                <Link href="/dashboard/settings/tpmjs-api-keys">
                  <Button variant="outline" size="sm">
                    Manage API Keys
                  </Button>
                </Link>
              </div>
            </div>

            {/* ==================== OVERVIEW ==================== */}
            <DocSection id="introduction" title="Introduction">
              <p className="text-foreground-secondary mb-6">
                TPMJS is more than a tool registry—it&apos;s a platform for building, sharing, and
                deploying AI-powered workflows. This guide covers the key platform features that let
                you organize tools, create AI agents, and share your work.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                <InfoCard icon="👤" title="User Accounts">
                  Create a profile with a unique username to own collections, agents, and access
                  protected features
                </InfoCard>
                <InfoCard icon="📦" title="Collections">
                  Group tools into curated sets that can be shared and connected to MCP clients like
                  Claude Desktop
                </InfoCard>
                <InfoCard icon="🤖" title="Agents">
                  Build custom AI assistants with multi-provider support, tool integration, and
                  persistent conversations
                </InfoCard>
                <InfoCard icon="🔀" title="Forking">
                  Clone public agents and collections to customize them for your own use
                </InfoCard>
                <InfoCard icon="🔑" title="API Keys">
                  Programmatic access to the platform with scoped permissions and rate limiting
                </InfoCard>
                <InfoCard icon="📊" title="Usage Tracking">
                  Monitor API usage, token consumption, and costs across your agents and collections
                </InfoCard>
              </div>
            </DocSection>

            <DocSection id="getting-started" title="Getting Started">
              <p className="text-foreground-secondary mb-6">
                Follow these steps to get started with the TPMJS platform features.
              </p>
              <div className="space-y-4">
                <div className="p-4 border border-border rounded-lg bg-surface">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center">
                      1
                    </span>
                    <h4 className="font-semibold text-foreground">Create an Account</h4>
                  </div>
                  <p className="text-sm text-foreground-secondary ml-11">
                    Sign up at{' '}
                    <Link href="/sign-up" className="text-primary hover:underline">
                      tpmjs.com/sign-up
                    </Link>{' '}
                    with email. You&apos;ll need to verify your email address.
                  </p>
                </div>
                <div className="p-4 border border-border rounded-lg bg-surface">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center">
                      2
                    </span>
                    <h4 className="font-semibold text-foreground">Set Up Your Profile</h4>
                  </div>
                  <p className="text-sm text-foreground-secondary ml-11">
                    Choose a unique username. This will be used in your public URLs (e.g.,
                    tpmjs.com/your-username).
                  </p>
                </div>
                <div className="p-4 border border-border rounded-lg bg-surface">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center">
                      3
                    </span>
                    <h4 className="font-semibold text-foreground">Generate an API Key</h4>
                  </div>
                  <p className="text-sm text-foreground-secondary ml-11">
                    Go to{' '}
                    <Link
                      href="/dashboard/settings/tpmjs-api-keys"
                      className="text-primary hover:underline"
                    >
                      Dashboard → Settings → API Keys
                    </Link>{' '}
                    to create an API key for MCP connections and programmatic access.
                  </p>
                </div>
                <div className="p-4 border border-border rounded-lg bg-surface">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center">
                      4
                    </span>
                    <h4 className="font-semibold text-foreground">Create Your First Collection</h4>
                  </div>
                  <p className="text-sm text-foreground-secondary ml-11">
                    Go to{' '}
                    <Link href="/dashboard/collections" className="text-primary hover:underline">
                      Dashboard → Collections
                    </Link>{' '}
                    and create a collection to group related tools together.
                  </p>
                </div>
              </div>
            </DocSection>

            {/* ==================== USER ACCOUNTS ==================== */}
            <DocSection id="accounts-overview" title="User Accounts Overview">
              <p className="text-foreground-secondary mb-6">
                A TPMJS account gives you ownership and control over collections, agents, and API
                keys. Your account includes a public profile that showcases your public work.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <InfoCard icon="🔐" title="Authentication">
                  Email/password authentication with email verification. Sessions last 7 days.
                </InfoCard>
                <InfoCard icon="💾" title="Data Ownership">
                  You own all your collections, agents, API keys, and conversation history.
                </InfoCard>
              </div>
              <DocSubSection title="Account Features">
                <ul className="list-disc list-inside space-y-2 text-foreground-secondary">
                  <li>
                    <strong className="text-foreground">Collections</strong> - Create up to 50
                    collections to organize tools
                  </li>
                  <li>
                    <strong className="text-foreground">Agents</strong> - Create up to 20 AI agents
                    with custom configurations
                  </li>
                  <li>
                    <strong className="text-foreground">API Keys</strong> - Generate up to 10 API
                    keys for programmatic access
                  </li>
                  <li>
                    <strong className="text-foreground">Provider Keys</strong> - Store encrypted API
                    keys for LLM providers (OpenAI, Anthropic, etc.)
                  </li>
                  <li>
                    <strong className="text-foreground">Activity Feed</strong> - Track your actions
                    with a complete audit trail
                  </li>
                  <li>
                    <strong className="text-foreground">Usage Analytics</strong> - Monitor API calls,
                    tokens, and costs
                  </li>
                </ul>
              </DocSubSection>
            </DocSection>

            <DocSection id="usernames" title="Usernames & Profiles">
              <p className="text-foreground-secondary mb-6">
                Your username is a unique identifier that becomes part of your public URLs. Choose
                carefully—it&apos;s how others will find and reference your work.
              </p>
              <DocSubSection title="Username Requirements">
                <ul className="list-disc list-inside space-y-2 text-foreground-secondary mb-4">
                  <li>3-30 characters long</li>
                  <li>Lowercase letters, numbers, and hyphens only</li>
                  <li>Must start and end with a letter or number (not hyphen)</li>
                  <li>Must be unique across all TPMJS users</li>
                </ul>
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
- ab (too short, minimum 3 chars)`}
                />
              </DocSubSection>
              <DocSubSection title="Reserved Names">
                <p className="text-foreground-secondary mb-4">
                  Certain names are reserved and cannot be used as usernames:
                </p>
                <div className="flex flex-wrap gap-2">
                  {[
                    'admin',
                    'api',
                    'dashboard',
                    'blog',
                    'docs',
                    'help',
                    'support',
                    'settings',
                    'login',
                    'signup',
                  ].map((name) => (
                    <Badge key={name} variant="secondary" size="sm">
                      {name}
                    </Badge>
                  ))}
                </div>
              </DocSubSection>
              <DocSubSection title="Checking Availability">
                <p className="text-foreground-secondary mb-4">
                  When setting up your profile, usernames are checked in real-time for availability.
                  You can also check programmatically:
                </p>
                <CodeBlock
                  language="bash"
                  code="curl https://tpmjs.com/api/user/username/check?username=your-username"
                />
              </DocSubSection>
            </DocSection>

            <DocSection id="public-pages" title="Public Pages">
              <p className="text-foreground-secondary mb-6">
                Your public profile displays your name, avatar, and all public agents and
                collections. Others can view your work and fork items they find useful.
              </p>
              <DocSubSection title="Profile URL">
                <div className="space-y-3">
                  <div className="p-4 border border-border rounded-lg bg-surface">
                    <code className="text-primary font-mono text-sm block mb-2">
                      tpmjs.com/{'{username}'}
                    </code>
                    <p className="text-sm text-foreground-secondary">
                      Your public profile showing all public agents and collections
                    </p>
                  </div>
                  <div className="p-4 border border-border rounded-lg bg-surface">
                    <code className="text-primary font-mono text-sm block mb-2">
                      tpmjs.com/@{'{username}'}
                    </code>
                    <p className="text-sm text-foreground-secondary">
                      Alternative social-media style URL (works identically)
                    </p>
                  </div>
                </div>
              </DocSubSection>
              <DocSubSection title="Public vs Private">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border border-border rounded-lg bg-surface">
                    <h4 className="font-semibold text-foreground mb-2">Public Items</h4>
                    <ul className="text-sm text-foreground-secondary space-y-1">
                      <li>• Visible on your profile page</li>
                      <li>• Anyone can view details</li>
                      <li>• Can be forked by others</li>
                      <li>• Shows in search results</li>
                    </ul>
                  </div>
                  <div className="p-4 border border-border rounded-lg bg-surface">
                    <h4 className="font-semibold text-foreground mb-2">Private Items</h4>
                    <ul className="text-sm text-foreground-secondary space-y-1">
                      <li>• Only visible to you</li>
                      <li>• Not shown on profile</li>
                      <li>• Cannot be forked</li>
                      <li>• Direct URL returns 404</li>
                    </ul>
                  </div>
                </div>
              </DocSubSection>
            </DocSection>

            {/* ==================== COLLECTIONS ==================== */}
            <DocSection id="collections-overview" title="Collections Overview">
              <p className="text-foreground-secondary mb-6">
                Collections are curated groups of tools that you can share and connect to MCP
                clients. Think of them as playlists for AI tools—bundle related tools together for
                specific use cases.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <InfoCard icon="🗂️" title="Organize">
                  Group related tools together for web scraping, content creation, data analysis, or
                  any workflow
                </InfoCard>
                <InfoCard icon="🔗" title="Connect">
                  Each collection gets unique MCP URLs for Claude Desktop, Cursor, and other MCP
                  clients
                </InfoCard>
                <InfoCard icon="🔄" title="Share">
                  Make collections public so others can fork them and build on your work
                </InfoCard>
              </div>
              <DocSubSection title="Collection Features">
                <ul className="list-disc list-inside space-y-2 text-foreground-secondary">
                  <li>
                    <strong className="text-foreground">Tool Grouping</strong> - Add up to 100 tools
                    per collection
                  </li>
                  <li>
                    <strong className="text-foreground">Custom Ordering</strong> - Arrange tools in
                    your preferred order
                  </li>
                  <li>
                    <strong className="text-foreground">Tool Notes</strong> - Add notes explaining
                    why each tool is included
                  </li>
                  <li>
                    <strong className="text-foreground">Environment Variables</strong> - Store API
                    keys that are passed to tools at runtime
                  </li>
                  <li>
                    <strong className="text-foreground">MCP Integration</strong> - Connect to Claude
                    Desktop with a single URL
                  </li>
                  <li>
                    <strong className="text-foreground">AI Use Cases</strong> - Auto-generate
                    workflow suggestions
                  </li>
                </ul>
              </DocSubSection>
            </DocSection>

            <DocSection id="creating-collections" title="Creating Collections">
              <p className="text-foreground-secondary mb-6">
                Create a collection from your dashboard to start organizing tools.
              </p>
              <DocSubSection title="Collection Fields">
                <ParamTable
                  params={[
                    {
                      name: 'Name',
                      type: 'string',
                      required: true,
                      description: 'Display name for your collection (max 100 chars)',
                    },
                    {
                      name: 'Slug',
                      type: 'string',
                      required: false,
                      description:
                        'URL-friendly identifier (auto-generated from name). Used in MCP URLs.',
                    },
                    {
                      name: 'Description',
                      type: 'string',
                      required: false,
                      description: 'Brief description of the collection purpose (max 500 chars)',
                    },
                    {
                      name: 'Public',
                      type: 'boolean',
                      required: false,
                      description:
                        'Whether the collection is visible to others. Default: false (private)',
                    },
                  ]}
                />
              </DocSubSection>
              <DocSubSection title="Steps to Create">
                <div className="space-y-3 text-foreground-secondary">
                  <p>
                    1. Go to{' '}
                    <Link href="/dashboard/collections" className="text-primary hover:underline">
                      Dashboard → Collections
                    </Link>
                  </p>
                  <p>2. Click &quot;Create Collection&quot;</p>
                  <p>3. Enter a name and optional description</p>
                  <p>4. Click &quot;Create&quot; to save</p>
                  <p>5. Add tools from the registry using the &quot;Add Tool&quot; button</p>
                </div>
              </DocSubSection>
            </DocSection>

            <DocSection id="collection-tools" title="Adding Tools to Collections">
              <p className="text-foreground-secondary mb-6">
                After creating a collection, add tools from the TPMJS registry to build your
                toolkit.
              </p>
              <DocSubSection title="Adding Tools">
                <p className="text-foreground-secondary mb-4">
                  From your collection&apos;s detail page, use the &quot;Add Tool&quot; button to
                  search the registry. You can search by name, description, or category.
                </p>
              </DocSubSection>
              <DocSubSection title="Tool Notes">
                <p className="text-foreground-secondary mb-4">
                  Add notes to each tool explaining why it&apos;s in the collection or how to use
                  it. Notes are visible to anyone viewing the collection and help provide context.
                </p>
                <div className="p-4 border border-border rounded-lg bg-surface">
                  <p className="text-sm text-foreground-secondary">
                    <strong className="text-foreground">Example Note:</strong> &quot;Use this tool
                    first to scrape the webpage, then pass the result to the summarization
                    tool.&quot;
                  </p>
                </div>
              </DocSubSection>
              <DocSubSection title="Reordering Tools">
                <p className="text-foreground-secondary">
                  Tools are presented to AI models in the order they appear in your collection. You
                  can drag and drop to reorder tools based on your preferred workflow.
                </p>
              </DocSubSection>
            </DocSection>

            <DocSection id="mcp-integration" title="MCP Integration">
              <p className="text-foreground-secondary mb-6">
                The Model Context Protocol (MCP) allows AI assistants to connect directly to your
                collections. Each collection gets unique MCP URLs that work with Claude Desktop,
                Cursor, and other MCP clients.
              </p>
              <DocSubSection title="MCP Server URLs">
                <p className="text-foreground-secondary mb-4">
                  Each collection provides two transport options:
                </p>
                <div className="space-y-3">
                  <div className="p-4 border border-border rounded-lg bg-surface">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="success" size="sm">
                        Recommended
                      </Badge>
                      <code className="text-primary font-mono text-sm">HTTP Transport</code>
                    </div>
                    <code className="text-xs text-foreground-secondary block">
                      https://tpmjs.com/api/mcp/{'{username}'}/{'{collection-slug}'}/http
                    </code>
                  </div>
                  <div className="p-4 border border-border rounded-lg bg-surface">
                    <code className="text-primary font-mono text-sm block mb-2">SSE Transport</code>
                    <code className="text-xs text-foreground-secondary block">
                      https://tpmjs.com/api/mcp/{'{username}'}/{'{collection-slug}'}/sse
                    </code>
                  </div>
                </div>
              </DocSubSection>
              <DocSubSection title="Claude Desktop Configuration">
                <p className="text-foreground-secondary mb-4">
                  Add your collection to Claude Desktop&apos;s configuration file:
                </p>
                <CodeBlock
                  language="json"
                  code={`{
  "mcpServers": {
    "tpmjs-my-collection": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "https://tpmjs.com/api/mcp/YOUR_USERNAME/YOUR_COLLECTION_SLUG/http",
        "--header",
        "Authorization: Bearer YOUR_TPMJS_API_KEY"
      ]
    }
  }
}`}
                />
                <p className="text-foreground-secondary mt-4">
                  <strong className="text-foreground">Config file location:</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 text-foreground-secondary text-sm mt-2">
                  <li>
                    <strong>macOS:</strong>{' '}
                    <code className="text-primary">
                      ~/Library/Application Support/Claude/claude_desktop_config.json
                    </code>
                  </li>
                  <li>
                    <strong>Windows:</strong>{' '}
                    <code className="text-primary">%APPDATA%\Claude\claude_desktop_config.json</code>
                  </li>
                </ul>
              </DocSubSection>
              <DocSubSection title="Claude Code CLI">
                <CodeBlock
                  language="bash"
                  code={`claude mcp add tpmjs-my-collection \\
  -- npx mcp-remote https://tpmjs.com/api/mcp/YOUR_USERNAME/YOUR_COLLECTION_SLUG/http \\
  --header "Authorization: Bearer YOUR_TPMJS_API_KEY"`}
                />
              </DocSubSection>
            </DocSection>

            <DocSection id="collection-env-vars" title="Collection Environment Variables">
              <p className="text-foreground-secondary mb-6">
                Many tools require API keys to function. You can store these as environment
                variables on your collection, and they&apos;ll be passed to tools at runtime.
              </p>
              <DocSubSection title="Adding Environment Variables">
                <div className="space-y-3 text-foreground-secondary">
                  <p>1. Open your collection and go to the &quot;Env Vars&quot; tab</p>
                  <p>2. Click &quot;Add Variable&quot;</p>
                  <p>3. Enter the variable name (e.g., FIRECRAWL_API_KEY) and value</p>
                  <p>4. Click &quot;Save&quot;</p>
                </div>
              </DocSubSection>
              <DocSubSection title="Security">
                <div className="p-4 border border-primary/30 rounded-lg bg-primary/5">
                  <p className="text-sm text-foreground-secondary">
                    <strong className="text-foreground">Encryption:</strong> Environment variables
                    are encrypted using AES-256 before storage. They&apos;re decrypted only at
                    runtime when tools are executed. Variables are never exposed in API responses.
                  </p>
                </div>
              </DocSubSection>
              <DocSubSection title="Common Variables">
                <div className="space-y-2">
                  {[
                    { name: 'FIRECRAWL_API_KEY', desc: 'Web scraping with Firecrawl' },
                    { name: 'EXA_API_KEY', desc: 'Web search with Exa' },
                    { name: 'TAVILY_API_KEY', desc: 'Web search with Tavily' },
                    { name: 'BROWSERBASE_API_KEY', desc: 'Browser automation' },
                  ].map((v) => (
                    <div key={v.name} className="p-3 border border-border rounded-lg bg-surface">
                      <code className="text-primary font-mono text-sm">{v.name}</code>
                      <p className="text-xs text-foreground-secondary mt-1">{v.desc}</p>
                    </div>
                  ))}
                </div>
              </DocSubSection>
            </DocSection>

            {/* ==================== AGENTS ==================== */}
            <DocSection id="agents-overview" title="Agents Overview">
              <p className="text-foreground-secondary mb-6">
                TPMJS Agents are custom AI assistants powered by any LLM provider. Build agents with
                custom system prompts, attach tools, and have persistent conversations through a
                streaming API.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <InfoCard icon="🤖" title="Multi-Provider">
                  Support for OpenAI, Anthropic, Google, Groq, and Mistral—bring your own API keys
                </InfoCard>
                <InfoCard icon="🔧" title="Tool Integration">
                  Attach individual tools or entire collections to give your agent capabilities
                </InfoCard>
                <InfoCard icon="💬" title="Conversations">
                  Full conversation history with streaming responses and tool call visualization
                </InfoCard>
              </div>
              <div className="p-4 border border-border rounded-lg bg-surface">
                <p className="text-sm text-foreground-secondary">
                  <strong className="text-foreground">Note:</strong> Agents require LLM provider API
                  keys. You&apos;ll need to add your keys in{' '}
                  <Link
                    href="/dashboard/settings/api-keys"
                    className="text-primary hover:underline"
                  >
                    Dashboard → Settings → API Keys
                  </Link>{' '}
                  before creating agents.
                </p>
              </div>
            </DocSection>

            <DocSection id="creating-agents" title="Creating Agents">
              <p className="text-foreground-secondary mb-6">
                Create an agent to customize its behavior with a system prompt, choose the AI model,
                and configure execution parameters.
              </p>
              <DocSubSection title="Basic Configuration">
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
                    {
                      name: 'Provider',
                      type: 'enum',
                      required: true,
                      description: 'LLM provider: OPENAI, ANTHROPIC, GOOGLE, GROQ, or MISTRAL',
                    },
                    {
                      name: 'Model',
                      type: 'string',
                      required: true,
                      description: 'Specific model ID (e.g., gpt-4o, claude-sonnet-4-20250514)',
                    },
                  ]}
                />
              </DocSubSection>
              <DocSubSection title="Advanced Settings">
                <ParamTable
                  params={[
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
                      description: 'Response randomness (0 = deterministic, 2 = creative). Default: 0.7',
                    },
                    {
                      name: 'Max Tool Calls',
                      type: 'number',
                      required: false,
                      description: 'Maximum tool calls per turn (1-100). Default: 20',
                    },
                    {
                      name: 'Context Messages',
                      type: 'number',
                      required: false,
                      description: 'Recent messages included in context (1-100). Default: 10',
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

            <DocSection id="agent-tools" title="Attaching Tools to Agents">
              <p className="text-foreground-secondary mb-6">
                Give your agent capabilities by attaching tools from the TPMJS registry. You can
                attach individual tools or entire collections.
              </p>
              <DocSubSection title="Individual Tools">
                <p className="text-foreground-secondary mb-4">
                  From your agent&apos;s detail page, use the &quot;Add Tool&quot; button to search
                  and attach specific tools. Each tool appears with its name, description, and
                  required environment variables.
                </p>
              </DocSubSection>
              <DocSubSection title="Attaching Collections">
                <p className="text-foreground-secondary mb-4">
                  You can attach entire collections to your agent. When a collection is attached,
                  the agent can use all tools in that collection. This is useful for grouping
                  related tools.
                </p>
                <div className="p-4 border border-border rounded-lg bg-surface">
                  <p className="text-sm text-foreground-secondary">
                    <strong className="text-foreground">Tip:</strong> Collections inherit
                    environment variables from the agent. Set up your API keys once on the agent,
                    and they&apos;ll be available to all attached collections and tools.
                  </p>
                </div>
              </DocSubSection>
              <DocSubSection title="Tool Limits">
                <ul className="list-disc list-inside space-y-2 text-foreground-secondary">
                  <li>Maximum 50 individual tools per agent</li>
                  <li>Maximum 10 collections per agent</li>
                  <li>Tools from attached collections don&apos;t count against the 50 tool limit</li>
                </ul>
              </DocSubSection>
            </DocSection>

            <DocSection id="agent-chat" title="Chat Interface">
              <p className="text-foreground-secondary mb-6">
                Interact with your agents through the built-in chat interface with streaming
                responses and tool call visualization.
              </p>
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
                    parameters and results.
                  </InfoCard>
                  <InfoCard icon="📊" title="Token Usage">
                    Token counts are tracked and displayed for monitoring usage and costs.
                  </InfoCard>
                </div>
              </DocSubSection>
              <DocSubSection title="Chat URLs">
                <div className="space-y-3">
                  <div className="p-4 border border-border rounded-lg bg-surface">
                    <code className="text-primary font-mono text-sm block mb-2">
                      tpmjs.com/{'{username}'}/agents/{'{agent-uid}'}/chat
                    </code>
                    <p className="text-sm text-foreground-secondary">
                      Public chat URL for public agents
                    </p>
                  </div>
                  <div className="p-4 border border-border rounded-lg bg-surface">
                    <code className="text-primary font-mono text-sm block mb-2">
                      /dashboard/agents/{'{id}'}/chat/{'{chatId}'}
                    </code>
                    <p className="text-sm text-foreground-secondary">
                      Dashboard chat URL for your own agents
                    </p>
                  </div>
                </div>
              </DocSubSection>
            </DocSection>

            <DocSection id="agent-providers" title="LLM Providers">
              <p className="text-foreground-secondary mb-6">
                TPMJS Agents support multiple AI providers. Each provider offers different models
                with varying capabilities and pricing.
              </p>
              <div className="space-y-4">
                {[
                  {
                    name: 'OpenAI',
                    desc: 'GPT models with excellent tool use support',
                    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'],
                    keyUrl: 'https://platform.openai.com/api-keys',
                  },
                  {
                    name: 'Anthropic',
                    desc: 'Claude models known for nuanced understanding',
                    models: ['claude-sonnet-4-20250514', 'claude-3-5-haiku-20241022', 'claude-3-opus-20240229'],
                    keyUrl: 'https://console.anthropic.com/settings/keys',
                  },
                  {
                    name: 'Google',
                    desc: 'Gemini models with multimodal capabilities',
                    models: ['gemini-2.0-flash-exp', 'gemini-1.5-pro', 'gemini-1.5-flash'],
                    keyUrl: 'https://aistudio.google.com/apikey',
                  },
                  {
                    name: 'Groq',
                    desc: 'Ultra-fast inference for open-source models',
                    models: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768'],
                    keyUrl: 'https://console.groq.com/keys',
                  },
                  {
                    name: 'Mistral',
                    desc: 'European models with strong multilingual support',
                    models: ['mistral-large-latest', 'mistral-small-latest'],
                    keyUrl: 'https://console.mistral.ai/api-keys',
                  },
                ].map((provider) => (
                  <div key={provider.name} className="p-4 border border-border rounded-lg bg-surface">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-foreground">{provider.name}</h4>
                      <a
                        href={provider.keyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline"
                      >
                        Get API Key →
                      </a>
                    </div>
                    <p className="text-sm text-foreground-secondary mb-2">{provider.desc}</p>
                    <div className="flex flex-wrap gap-2">
                      {provider.models.map((model) => (
                        <Badge key={model} variant="secondary" size="sm">
                          {model}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </DocSection>

            {/* ==================== FORKING ==================== */}
            <DocSection id="forking-overview" title="Forking Overview">
              <p className="text-foreground-secondary mb-6">
                Forking lets you clone public agents and collections to your own account. The forked
                copy is independent—you can customize it without affecting the original.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <InfoCard icon="🔀" title="Clone & Customize">
                  Start with someone else&apos;s configuration and adapt it to your needs
                </InfoCard>
                <InfoCard icon="🔒" title="Security First">
                  API keys and sensitive config are never copied—you add your own
                </InfoCard>
              </div>
              <DocSubSection title="What Gets Forked">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border border-border rounded-lg bg-surface">
                    <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                      <Badge variant="success" size="sm">
                        Included
                      </Badge>
                    </h4>
                    <ul className="text-sm text-foreground-secondary space-y-1">
                      <li>• Name and description</li>
                      <li>• System prompt (agents)</li>
                      <li>• Provider and model settings</li>
                      <li>• All attached tools</li>
                      <li>• Tool order and notes</li>
                      <li>• Temperature and other params</li>
                    </ul>
                  </div>
                  <div className="p-4 border border-border rounded-lg bg-surface">
                    <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                      <Badge variant="secondary" size="sm">
                        Not Included
                      </Badge>
                    </h4>
                    <ul className="text-sm text-foreground-secondary space-y-1">
                      <li>• Environment variables / API keys</li>
                      <li>• Executor configuration</li>
                      <li>• Conversation history</li>
                      <li>• Like count</li>
                      <li>• Fork count</li>
                    </ul>
                  </div>
                </div>
              </DocSubSection>
            </DocSection>

            <DocSection id="fork-agents" title="Fork Agents">
              <p className="text-foreground-secondary mb-6">
                When you find a public agent you like, fork it to your account to customize it.
              </p>
              <DocSubSection title="How to Fork an Agent">
                <div className="space-y-3 text-foreground-secondary">
                  <p>
                    1. Navigate to a public agent&apos;s detail page (e.g.,{' '}
                    <code className="text-primary bg-surface px-1.5 py-0.5 rounded">
                      tpmjs.com/ajax/agents/research-assistant
                    </code>
                    )
                  </p>
                  <p>2. Click the &quot;Fork&quot; button in the header</p>
                  <p>3. The agent is copied to your account with all its tools and settings</p>
                  <p>4. You&apos;re redirected to your dashboard to customize the forked agent</p>
                  <p>5. Add your own API keys to make the agent functional</p>
                </div>
              </DocSubSection>
              <DocSubSection title="Fork Button States">
                <div className="space-y-2">
                  <div className="p-3 border border-border rounded-lg bg-surface">
                    <Badge variant="default" size="sm" className="mb-1">
                      Fork
                    </Badge>
                    <p className="text-xs text-foreground-secondary">
                      Available when viewing a public agent you don&apos;t own
                    </p>
                  </div>
                  <div className="p-3 border border-border rounded-lg bg-surface">
                    <Badge variant="secondary" size="sm" className="mb-1">
                      Your Agent
                    </Badge>
                    <p className="text-xs text-foreground-secondary">
                      Shown when viewing your own agent
                    </p>
                  </div>
                  <div className="p-3 border border-border rounded-lg bg-surface">
                    <Badge variant="secondary" size="sm" className="mb-1">
                      Already Forked
                    </Badge>
                    <p className="text-xs text-foreground-secondary">
                      You&apos;ve already forked this agent (links to your fork)
                    </p>
                  </div>
                  <div className="p-3 border border-border rounded-lg bg-surface">
                    <Badge variant="secondary" size="sm" className="mb-1">
                      Limit Reached
                    </Badge>
                    <p className="text-xs text-foreground-secondary">
                      You&apos;ve reached the maximum of 20 agents
                    </p>
                  </div>
                </div>
              </DocSubSection>
            </DocSection>

            <DocSection id="fork-collections" title="Fork Collections">
              <p className="text-foreground-secondary mb-6">
                Fork collections to get a copy you can modify without affecting the original.
              </p>
              <DocSubSection title="How to Fork a Collection">
                <div className="space-y-3 text-foreground-secondary">
                  <p>
                    1. Navigate to a public collection&apos;s page (e.g.,{' '}
                    <code className="text-primary bg-surface px-1.5 py-0.5 rounded">
                      tpmjs.com/ajax/collections/web-scraping
                    </code>
                    )
                  </p>
                  <p>2. Click the &quot;Fork&quot; button</p>
                  <p>3. The collection is copied with all its tools</p>
                  <p>4. You can then add, remove, or reorder tools</p>
                  <p>5. Add your own environment variables for the tools</p>
                </div>
              </DocSubSection>
              <DocSubSection title="Collection Fork Limits">
                <ul className="list-disc list-inside space-y-2 text-foreground-secondary">
                  <li>Maximum 50 collections per user</li>
                  <li>Forked collections start as private</li>
                  <li>New MCP URLs are generated for your fork</li>
                </ul>
              </DocSubSection>
            </DocSection>

            <DocSection id="fork-attribution" title="Fork Attribution">
              <p className="text-foreground-secondary mb-6">
                TPMJS tracks fork relationships so you can see where agents and collections
                originated.
              </p>
              <DocSubSection title="Forked From Badge">
                <p className="text-foreground-secondary mb-4">
                  Forked items display a &quot;Forked from&quot; badge linking back to the original.
                  This provides attribution and lets users discover the source.
                </p>
                <div className="p-4 border border-border rounded-lg bg-surface">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-foreground-tertiary">Forked from</span>
                    <Link href="#" className="text-primary hover:underline">
                      ajax/research-assistant
                    </Link>
                  </div>
                </div>
              </DocSubSection>
              <DocSubSection title="Fork Count">
                <p className="text-foreground-secondary">
                  Public agents and collections display a fork count showing how many times
                  they&apos;ve been forked. This indicates popularity and usefulness to the
                  community.
                </p>
              </DocSubSection>
            </DocSection>

            {/* ==================== API KEYS ==================== */}
            <DocSection id="api-keys-overview" title="API Keys Overview">
              <p className="text-foreground-secondary mb-6">
                TPMJS API keys provide programmatic access to the platform. Use them for MCP
                connections, agent conversations, and API integrations.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <InfoCard icon="🔑" title="Secure">
                  Keys are hashed using SHA-256—we never store the raw key
                </InfoCard>
                <InfoCard icon="🎯" title="Scoped">
                  Fine-grained permissions control what each key can do
                </InfoCard>
                <InfoCard icon="📊" title="Tracked">
                  Usage is recorded for monitoring and debugging
                </InfoCard>
              </div>
              <DocSubSection title="Key Format">
                <p className="text-foreground-secondary mb-4">
                  TPMJS API keys follow a consistent format for easy identification:
                </p>
                <CodeBlock language="text" code="tpmjs_sk_abc123def456ghi789..." />
                <ul className="list-disc list-inside space-y-2 text-foreground-secondary mt-4">
                  <li>
                    <code className="text-primary">tpmjs_sk_</code> prefix identifies the key type
                  </li>
                  <li>32 random bytes encoded as base64url</li>
                  <li>Shown in full only once at creation time</li>
                  <li>Displayed as prefix only (e.g., tpmjs_sk_abc1...) in the dashboard</li>
                </ul>
              </DocSubSection>
            </DocSection>

            <DocSection id="creating-api-keys" title="Creating API Keys">
              <p className="text-foreground-secondary mb-6">
                Generate API keys from your dashboard to enable programmatic access.
              </p>
              <DocSubSection title="Steps to Create">
                <div className="space-y-3 text-foreground-secondary">
                  <p>
                    1. Go to{' '}
                    <Link
                      href="/dashboard/settings/tpmjs-api-keys"
                      className="text-primary hover:underline"
                    >
                      Dashboard → Settings → API Keys
                    </Link>
                  </p>
                  <p>2. Click &quot;Generate New Key&quot;</p>
                  <p>3. Enter a descriptive name (e.g., &quot;Claude Desktop&quot;)</p>
                  <p>4. Click &quot;Create&quot;</p>
                  <p>5. Copy the key immediately—it&apos;s only shown once!</p>
                </div>
              </DocSubSection>
              <DocSubSection title="Key Management">
                <div className="space-y-3">
                  <div className="p-4 border border-border rounded-lg bg-surface">
                    <h4 className="font-semibold text-foreground mb-1">Activate/Deactivate</h4>
                    <p className="text-sm text-foreground-secondary">
                      Toggle keys on/off without deleting them. Useful for temporarily disabling
                      access.
                    </p>
                  </div>
                  <div className="p-4 border border-border rounded-lg bg-surface">
                    <h4 className="font-semibold text-foreground mb-1">Rotate</h4>
                    <p className="text-sm text-foreground-secondary">
                      Generate a new key with the same name and settings. The old key is immediately
                      invalidated.
                    </p>
                  </div>
                  <div className="p-4 border border-border rounded-lg bg-surface">
                    <h4 className="font-semibold text-foreground mb-1">Delete</h4>
                    <p className="text-sm text-foreground-secondary">
                      Permanently remove a key. Cannot be undone.
                    </p>
                  </div>
                </div>
              </DocSubSection>
              <div className="p-4 border border-warning/30 rounded-lg bg-warning/5 mt-4">
                <p className="text-sm text-foreground-secondary">
                  <strong className="text-warning">Important:</strong> Your API key is displayed only
                  once when created. Store it securely. If you lose it, you&apos;ll need to generate
                  a new one.
                </p>
              </div>
            </DocSection>

            <DocSection id="api-scopes" title="Scopes & Permissions">
              <p className="text-foreground-secondary mb-6">
                API keys have scopes that control what actions they can perform. By default, new
                keys have all scopes enabled.
              </p>
              <DocSubSection title="Available Scopes">
                <div className="space-y-3">
                  <div className="p-4 border border-border rounded-lg bg-surface">
                    <div className="flex items-center gap-2 mb-2">
                      <code className="text-primary font-mono">mcp:execute</code>
                    </div>
                    <p className="text-sm text-foreground-secondary">
                      Execute tools via MCP endpoints. Required for Claude Desktop and Cursor
                      integration.
                    </p>
                  </div>
                  <div className="p-4 border border-border rounded-lg bg-surface">
                    <div className="flex items-center gap-2 mb-2">
                      <code className="text-primary font-mono">agent:chat</code>
                    </div>
                    <p className="text-sm text-foreground-secondary">
                      Send messages to agents via the conversation API.
                    </p>
                  </div>
                  <div className="p-4 border border-border rounded-lg bg-surface">
                    <div className="flex items-center gap-2 mb-2">
                      <code className="text-primary font-mono">bridge:connect</code>
                    </div>
                    <p className="text-sm text-foreground-secondary">
                      Establish MCP bridge connections for local tool exposure.
                    </p>
                  </div>
                  <div className="p-4 border border-border rounded-lg bg-surface">
                    <div className="flex items-center gap-2 mb-2">
                      <code className="text-primary font-mono">usage:read</code>
                    </div>
                    <p className="text-sm text-foreground-secondary">
                      Access usage analytics and statistics via the API.
                    </p>
                  </div>
                  <div className="p-4 border border-border rounded-lg bg-surface">
                    <div className="flex items-center gap-2 mb-2">
                      <code className="text-primary font-mono">collection:read</code>
                    </div>
                    <p className="text-sm text-foreground-secondary">
                      Read collection details and list collections.
                    </p>
                  </div>
                </div>
              </DocSubSection>
              <DocSubSection title="Using API Keys">
                <p className="text-foreground-secondary mb-4">
                  Include your API key in the Authorization header:
                </p>
                <CodeBlock language="bash" code="Authorization: Bearer tpmjs_sk_your_api_key_here" />
                <p className="text-foreground-secondary mt-4">Example request:</p>
                <CodeBlock
                  language="bash"
                  code={`curl -H "Authorization: Bearer tpmjs_sk_your_api_key" \\
  "https://tpmjs.com/api/agents"`}
                />
              </DocSubSection>
            </DocSection>

            <DocSection id="rate-limits" title="Rate Limits">
              <p className="text-foreground-secondary mb-6">
                TPMJS enforces rate limits to ensure fair usage. Limits are based on your account
                tier.
              </p>
              <DocSubSection title="Limits by Tier">
                <div className="overflow-x-auto border border-border rounded-lg">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-surface">
                        <th className="text-left py-3 px-4 text-foreground font-medium">Tier</th>
                        <th className="text-left py-3 px-4 text-foreground font-medium">
                          Requests/Hour
                        </th>
                        <th className="text-left py-3 px-4 text-foreground font-medium">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-border">
                        <td className="py-3 px-4 text-foreground">Free</td>
                        <td className="py-3 px-4 font-mono text-primary">100</td>
                        <td className="py-3 px-4 text-foreground-secondary">Default tier</td>
                      </tr>
                      <tr className="border-b border-border">
                        <td className="py-3 px-4 text-foreground">Pro</td>
                        <td className="py-3 px-4 font-mono text-primary">1,000</td>
                        <td className="py-3 px-4 text-foreground-secondary">Paid subscription</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 text-foreground">Enterprise</td>
                        <td className="py-3 px-4 font-mono text-primary">10,000</td>
                        <td className="py-3 px-4 text-foreground-secondary">Custom plans</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </DocSubSection>
              <DocSubSection title="Rate Limit Headers">
                <p className="text-foreground-secondary mb-4">
                  Every response includes rate limit information:
                </p>
                <CodeBlock
                  language="text"
                  code={`X-RateLimit-Limit: 100
X-RateLimit-Remaining: 85
X-RateLimit-Reset: 1704067200`}
                />
              </DocSubSection>
              <DocSubSection title="Handling Rate Limits">
                <p className="text-foreground-secondary mb-4">
                  When rate limited, you&apos;ll receive a 429 response with a Retry-After header:
                </p>
                <CodeBlock
                  language="json"
                  code={`{
  "success": false,
  "error": {
    "code": "RATE_LIMITED",
    "message": "Too many requests. Please try again in 60 seconds."
  }
}`}
                />
              </DocSubSection>
            </DocSection>

            <DocSection id="api-usage" title="Usage Tracking">
              <p className="text-foreground-secondary mb-6">
                TPMJS tracks API usage for monitoring and billing purposes. View your usage in the
                dashboard.
              </p>
              <DocSubSection title="What&apos;s Tracked">
                <ul className="list-disc list-inside space-y-2 text-foreground-secondary">
                  <li>
                    <strong className="text-foreground">Request Count</strong> - Total API calls per
                    period
                  </li>
                  <li>
                    <strong className="text-foreground">Token Usage</strong> - Input/output tokens
                    for agent conversations
                  </li>
                  <li>
                    <strong className="text-foreground">Latency</strong> - Average response time per
                    endpoint
                  </li>
                  <li>
                    <strong className="text-foreground">Error Rate</strong> - Percentage of failed
                    requests
                  </li>
                  <li>
                    <strong className="text-foreground">Cost Estimation</strong> - Estimated LLM
                    costs based on token usage
                  </li>
                </ul>
              </DocSubSection>
              <DocSubSection title="Usage Dashboard">
                <p className="text-foreground-secondary mb-4">
                  View detailed usage analytics at{' '}
                  <Link href="/dashboard/usage" className="text-primary hover:underline">
                    Dashboard → Usage
                  </Link>
                  . The dashboard shows:
                </p>
                <ul className="list-disc list-inside space-y-2 text-foreground-secondary">
                  <li>Time-series graphs of requests and tokens</li>
                  <li>Breakdown by endpoint and API key</li>
                  <li>Hourly, daily, and monthly aggregations</li>
                  <li>Cost estimates based on provider pricing</li>
                </ul>
              </DocSubSection>
              <DocSubSection title="Data Retention">
                <ul className="list-disc list-inside space-y-2 text-foreground-secondary">
                  <li>
                    <strong className="text-foreground">Individual Records</strong> - Kept for 30
                    days
                  </li>
                  <li>
                    <strong className="text-foreground">Aggregated Summaries</strong> - Kept
                    indefinitely
                  </li>
                </ul>
              </DocSubSection>
            </DocSection>

            {/* ==================== REFERENCE ==================== */}
            <DocSection id="limits" title="Platform Limits">
              <p className="text-foreground-secondary mb-6">
                Reference of all platform limits to help you plan your usage.
              </p>
              <DocSubSection title="User Limits">
                <LimitTable
                  limits={[
                    {
                      resource: 'Collections',
                      limit: '50',
                      description: 'Maximum collections per user',
                    },
                    { resource: 'Agents', limit: '20', description: 'Maximum agents per user' },
                    { resource: 'API Keys', limit: '10', description: 'Maximum API keys per user' },
                  ]}
                />
              </DocSubSection>
              <DocSubSection title="Collection Limits">
                <LimitTable
                  limits={[
                    {
                      resource: 'Tools',
                      limit: '100',
                      description: 'Maximum tools per collection',
                    },
                    {
                      resource: 'Bridge Tools',
                      limit: '50',
                      description: 'Maximum bridge tools per collection',
                    },
                    {
                      resource: 'Name Length',
                      limit: '100 chars',
                      description: 'Maximum collection name length',
                    },
                    {
                      resource: 'Description',
                      limit: '500 chars',
                      description: 'Maximum description length',
                    },
                    {
                      resource: 'Tool Notes',
                      limit: '500 chars',
                      description: 'Maximum note length per tool',
                    },
                  ]}
                />
              </DocSubSection>
              <DocSubSection title="Agent Limits">
                <LimitTable
                  limits={[
                    { resource: 'Tools', limit: '50', description: 'Maximum tools per agent' },
                    {
                      resource: 'Collections',
                      limit: '10',
                      description: 'Maximum collections per agent',
                    },
                    {
                      resource: 'System Prompt',
                      limit: '10,000 chars',
                      description: 'Maximum system prompt length',
                    },
                    {
                      resource: 'Name Length',
                      limit: '100 chars',
                      description: 'Maximum agent name length',
                    },
                    {
                      resource: 'Description',
                      limit: '500 chars',
                      description: 'Maximum description length',
                    },
                    {
                      resource: 'UID Length',
                      limit: '50 chars',
                      description: 'Maximum UID length',
                    },
                  ]}
                />
              </DocSubSection>
              <DocSubSection title="Conversation Limits">
                <LimitTable
                  limits={[
                    {
                      resource: 'Conversations',
                      limit: '100',
                      description: 'Maximum conversations per agent',
                    },
                    {
                      resource: 'Message Length',
                      limit: '50,000 chars',
                      description: 'Maximum message length',
                    },
                    {
                      resource: 'Title Length',
                      limit: '200 chars',
                      description: 'Maximum conversation title',
                    },
                  ]}
                />
              </DocSubSection>
            </DocSection>

            <DocSection id="urls" title="URL Reference">
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
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-border">
                      <td className="py-3 px-4 text-foreground">User Profile</td>
                      <td className="py-3 px-4 font-mono text-primary text-xs">
                        /{'{username}'} or /@{'{username}'}
                      </td>
                    </tr>
                    <tr className="border-b border-border">
                      <td className="py-3 px-4 text-foreground">Agent Detail</td>
                      <td className="py-3 px-4 font-mono text-primary text-xs">
                        /{'{username}'}/agents/{'{uid}'}
                      </td>
                    </tr>
                    <tr className="border-b border-border">
                      <td className="py-3 px-4 text-foreground">Agent Chat</td>
                      <td className="py-3 px-4 font-mono text-primary text-xs">
                        /{'{username}'}/agents/{'{uid}'}/chat
                      </td>
                    </tr>
                    <tr className="border-b border-border">
                      <td className="py-3 px-4 text-foreground">Collection</td>
                      <td className="py-3 px-4 font-mono text-primary text-xs">
                        /{'{username}'}/collections/{'{slug}'}
                      </td>
                    </tr>
                    <tr className="border-b border-border">
                      <td className="py-3 px-4 text-foreground">Tool</td>
                      <td className="py-3 px-4 font-mono text-primary text-xs">
                        /tool/{'{package}'}/{'{tool}'}
                      </td>
                    </tr>
                    <tr className="border-b border-border bg-surface/50">
                      <td className="py-3 px-4 text-foreground" colSpan={2}>
                        <strong className="text-foreground-secondary">API Endpoints</strong>
                      </td>
                    </tr>
                    <tr className="border-b border-border">
                      <td className="py-3 px-4 text-foreground">MCP Server (HTTP)</td>
                      <td className="py-3 px-4 font-mono text-primary text-xs">
                        /api/mcp/{'{username}'}/{'{slug}'}/http
                      </td>
                    </tr>
                    <tr className="border-b border-border">
                      <td className="py-3 px-4 text-foreground">MCP Server (SSE)</td>
                      <td className="py-3 px-4 font-mono text-primary text-xs">
                        /api/mcp/{'{username}'}/{'{slug}'}/sse
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 text-foreground">Agent Conversation</td>
                      <td className="py-3 px-4 font-mono text-primary text-xs">
                        /api/{'{username}'}/agents/{'{uid}'}/conversation/{'{id}'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </DocSection>

            {/* CTA */}
            <section className="text-center py-12 border border-border rounded-lg bg-surface">
              <h2 className="text-2xl font-bold mb-4 text-foreground">Ready to Get Started?</h2>
              <p className="text-foreground-secondary mb-6 max-w-xl mx-auto">
                Create your account and start building with TPMJS today.
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Link href="/sign-up">
                  <Button variant="default" size="lg">
                    Create Account
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button variant="outline" size="lg">
                    Go to Dashboard
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
