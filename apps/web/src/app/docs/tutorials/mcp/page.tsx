'use client';

import { Button } from '@tpmjs/ui/Button/Button';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import Link from 'next/link';
import { useState } from 'react';
import { AppFooter } from '~/components/AppFooter';
import { AppHeader } from '~/components/AppHeader';

interface Slide {
  id: string;
  title: string;
  subtitle?: string;
  content: React.ReactNode;
  icon?: string;
}

const slides: Slide[] = [
  {
    id: 'intro',
    title: 'Connect TPMJS Tools to Your AI',
    subtitle: 'Use MCP to add powerful tools to Claude Desktop, Cursor, and more',
    icon: '🔌',
    content: (
      <div className="text-center space-y-6">
        <p className="text-xl text-foreground-secondary max-w-2xl mx-auto">
          The Model Context Protocol (MCP) lets AI assistants use external tools. TPMJS provides an
          MCP server that gives your AI access to our entire tool registry.
        </p>
        <div className="flex flex-wrap justify-center gap-4 mt-8">
          <div className="flex items-center gap-2 px-4 py-2 bg-surface-secondary rounded-full">
            <span>🎯</span>
            <span className="text-sm">Create Collection</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-surface-secondary rounded-full">
            <span>📋</span>
            <span className="text-sm">Copy MCP URL</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-surface-secondary rounded-full">
            <span>⚙️</span>
            <span className="text-sm">Add to Config</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-surface-secondary rounded-full">
            <span>✨</span>
            <span className="text-sm">Use Tools</span>
          </div>
        </div>
        <div className="pt-6">
          <p className="text-sm text-foreground-tertiary">
            Works with: Claude Desktop • Cursor • Any MCP-compatible client
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 'what-is-mcp',
    title: 'What is MCP?',
    subtitle: 'A simple way for AI assistants to use tools',
    icon: '📖',
    content: (
      <div className="space-y-8">
        <div className="max-w-3xl mx-auto grid md:grid-cols-2 gap-8">
          <div className="p-6 bg-surface-secondary rounded-lg border border-border">
            <h4 className="text-lg font-semibold text-foreground mb-3">Without MCP</h4>
            <ul className="space-y-3 text-foreground-secondary">
              <li className="flex items-start gap-2">
                <span className="text-red-500 mt-0.5">✗</span>
                <span>AI can only process text</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 mt-0.5">✗</span>
                <span>No access to external data</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 mt-0.5">✗</span>
                <span>Can't take real actions</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 mt-0.5">✗</span>
                <span>Limited to knowledge cutoff</span>
              </li>
            </ul>
          </div>
          <div className="p-6 bg-primary/5 rounded-lg border border-primary/20">
            <h4 className="text-lg font-semibold text-foreground mb-3">With MCP + TPMJS</h4>
            <ul className="space-y-3 text-foreground-secondary">
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>Execute code in 40+ languages</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>Fetch data from any URL</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>Search the web in real-time</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>Use specialized tools</span>
              </li>
            </ul>
          </div>
        </div>
        <div className="text-center">
          <p className="text-foreground-secondary">
            MCP is an <strong>open protocol</strong> by Anthropic for connecting AI to external
            capabilities.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 'step-1-collection',
    title: 'Step 1: Create a Collection',
    subtitle: 'Group the tools you want to use',
    icon: '📦',
    content: (
      <div className="space-y-8">
        <p className="text-lg text-foreground-secondary text-center max-w-2xl mx-auto">
          Collections bundle related tools together. Create one with the tools you need.
        </p>
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-start gap-4 p-4 bg-surface-secondary rounded-lg">
            <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center text-primary font-bold">
              1
            </div>
            <div>
              <p className="text-foreground font-medium">Go to Collections</p>
              <p className="text-foreground-secondary text-sm">
                Navigate to{' '}
                <span className="font-mono bg-background px-2 py-0.5 rounded">
                  Dashboard → Collections
                </span>
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4 p-4 bg-surface-secondary rounded-lg">
            <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center text-primary font-bold">
              2
            </div>
            <div>
              <p className="text-foreground font-medium">Create New Collection</p>
              <p className="text-foreground-secondary text-sm">
                Give it a name like "My Development Tools" or "Research Assistant"
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4 p-4 bg-surface-secondary rounded-lg">
            <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center text-primary font-bold">
              3
            </div>
            <div>
              <p className="text-foreground font-medium">Add Tools</p>
              <p className="text-foreground-secondary text-sm">
                Search for and add tools you want: code execution, web fetching, etc.
              </p>
            </div>
          </div>
        </div>
        <div className="text-center">
          <Link href="/dashboard/collections">
            <Button variant="default">Create a Collection →</Button>
          </Link>
        </div>
      </div>
    ),
  },
  {
    id: 'step-2-mcp-url',
    title: 'Step 2: Get Your MCP URL',
    subtitle: 'Each collection has a unique MCP endpoint',
    icon: '🔗',
    content: (
      <div className="space-y-8">
        <p className="text-lg text-foreground-secondary text-center max-w-2xl mx-auto">
          Your collection page shows the MCP URL. Just copy it!
        </p>
        <div className="max-w-3xl mx-auto">
          <div className="bg-surface-secondary rounded-lg border border-border overflow-hidden">
            <div className="p-4 border-b border-border bg-background">
              <p className="font-medium text-foreground">Collection: My Dev Tools</p>
              <p className="text-sm text-foreground-tertiary">5 tools</p>
            </div>
            <div className="p-4">
              <p className="text-sm font-medium text-foreground mb-2">MCP Server URL</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2 bg-background rounded border border-border text-sm font-mono text-foreground-secondary overflow-x-auto">
                  https://tpmjs.com/mcp/c/your-collection-uid
                </code>
                <Button variant="secondary" size="sm">
                  <Icon icon="copy" size="xs" className="mr-1" />
                  Copy
                </Button>
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-2xl mx-auto p-4 bg-primary/5 border border-primary/20 rounded-lg">
          <p className="text-sm text-foreground">
            <strong>💡 Tip:</strong> The URL format is{' '}
            <code className="bg-background px-1.5 py-0.5 rounded text-xs">
              tpmjs.com/mcp/c/{'{collection-uid}'}
            </code>
            — you can also find it on your collection's detail page.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 'step-3-claude',
    title: 'Step 3: Configure Claude Desktop',
    subtitle: 'Add the MCP server to your config file',
    icon: '🖥️',
    content: (
      <div className="space-y-8">
        <p className="text-lg text-foreground-secondary text-center max-w-2xl mx-auto">
          Open your Claude Desktop config file and add the TPMJS MCP server.
        </p>
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="p-3 bg-surface-secondary rounded-lg">
            <p className="text-sm font-medium text-foreground mb-1">Config File Location</p>
            <div className="space-y-1 text-sm text-foreground-secondary font-mono">
              <p>
                <span className="text-foreground-tertiary">macOS:</span> ~/Library/Application
                Support/Claude/claude_desktop_config.json
              </p>
              <p>
                <span className="text-foreground-tertiary">Windows:</span>{' '}
                %APPDATA%\Claude\claude_desktop_config.json
              </p>
            </div>
          </div>

          <div className="bg-background rounded-lg border border-border overflow-hidden">
            <div className="px-4 py-2 bg-surface-secondary border-b border-border">
              <p className="text-sm font-medium text-foreground">claude_desktop_config.json</p>
            </div>
            <pre className="p-4 text-sm overflow-x-auto">
              <code className="text-foreground-secondary">{`{
  "mcpServers": {
    "tpmjs-dev-tools": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "https://tpmjs.com/mcp/c/your-collection-uid"
      ]
    }
  }
}`}</code>
            </pre>
          </div>
        </div>
        <div className="text-center space-y-2">
          <p className="text-foreground-secondary text-sm">
            Replace <code className="bg-surface-secondary px-1.5 rounded">your-collection-uid</code>{' '}
            with your actual collection UID
          </p>
          <p className="text-foreground-tertiary text-sm">
            💡 Restart Claude Desktop after saving the config
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 'step-3-cursor',
    title: 'Alternative: Configure Cursor',
    subtitle: 'Same concept, slightly different config',
    icon: '✏️',
    content: (
      <div className="space-y-8">
        <p className="text-lg text-foreground-secondary text-center max-w-2xl mx-auto">
          Cursor also supports MCP! Add the server in Cursor settings.
        </p>
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="p-3 bg-surface-secondary rounded-lg">
            <p className="text-sm font-medium text-foreground mb-1">Open Cursor Settings</p>
            <p className="text-sm text-foreground-secondary">
              <code className="bg-background px-1.5 py-0.5 rounded">
                Settings → Features → MCP Servers → + Add Server
              </code>
            </p>
          </div>

          <div className="bg-background rounded-lg border border-border overflow-hidden">
            <div className="px-4 py-2 bg-surface-secondary border-b border-border">
              <p className="text-sm font-medium text-foreground">mcp.json (or via Settings UI)</p>
            </div>
            <pre className="p-4 text-sm overflow-x-auto">
              <code className="text-foreground-secondary">{`{
  "mcpServers": {
    "tpmjs": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "https://tpmjs.com/mcp/c/your-collection-uid"
      ]
    }
  }
}`}</code>
            </pre>
          </div>
        </div>
        <div className="max-w-2xl mx-auto p-4 bg-primary/5 border border-primary/20 rounded-lg">
          <p className="text-sm text-foreground">
            <strong>Any MCP client works!</strong> The URL format is the same regardless of which
            client you're using. Check your client's documentation for config file location.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 'step-4-use-tools',
    title: 'Step 4: Use Your Tools!',
    subtitle: 'Ask Claude to use any tool in your collection',
    icon: '🎉',
    content: (
      <div className="space-y-8">
        <p className="text-lg text-foreground-secondary text-center max-w-2xl mx-auto">
          After restarting, Claude will have access to all the tools in your collection.
        </p>
        <div className="max-w-3xl mx-auto">
          <div className="bg-surface-secondary rounded-lg border border-border overflow-hidden">
            <div className="p-4 border-b border-border bg-background">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center">
                  <span className="text-sm">🦊</span>
                </div>
                <p className="font-medium text-foreground">Claude Desktop</p>
              </div>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex justify-end">
                <div className="bg-primary text-primary-foreground rounded-lg px-4 py-2 max-w-[80%]">
                  <p className="text-sm">
                    Run this Python code and show me the output: print("Hello from TPMJS!")
                  </p>
                </div>
              </div>
              <div className="flex justify-start">
                <div className="bg-background rounded-lg px-4 py-2 max-w-[80%] border border-border">
                  <p className="text-xs text-primary mb-2">
                    Using tool: unsandbox-executeCodeAsync
                  </p>
                  <p className="text-sm text-foreground">Here's the result:</p>
                  <pre className="mt-2 p-2 bg-surface-secondary rounded text-xs font-mono">
                    Hello from TPMJS!
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-center gap-3 text-sm text-foreground-secondary">
          <span className="flex items-center gap-1">
            <span className="text-green-500">✓</span> Code execution
          </span>
          <span className="flex items-center gap-1">
            <span className="text-green-500">✓</span> Web fetching
          </span>
          <span className="flex items-center gap-1">
            <span className="text-green-500">✓</span> Web search
          </span>
          <span className="flex items-center gap-1">
            <span className="text-green-500">✓</span> And more!
          </span>
        </div>
      </div>
    ),
  },
  {
    id: 'complete',
    title: "You're Connected!",
    subtitle: 'Your AI now has superpowers',
    icon: '🚀',
    content: (
      <div className="space-y-8 text-center">
        <p className="text-xl text-foreground-secondary max-w-2xl mx-auto">
          That's it! Your AI assistant can now use any tool in your TPMJS collection.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link href="/dashboard/collections">
            <Button size="lg">Manage Collections</Button>
          </Link>
          <Link href="/docs">
            <Button variant="secondary" size="lg">
              View Full Documentation
            </Button>
          </Link>
        </div>
        <div className="max-w-2xl mx-auto pt-8 border-t border-border mt-8">
          <h4 className="text-lg font-semibold text-foreground mb-4">Quick Reference</h4>
          <div className="grid md:grid-cols-2 gap-4 text-left">
            <div className="p-4 bg-surface-secondary rounded-lg">
              <p className="font-medium text-foreground">Collection MCP URL</p>
              <code className="text-xs text-foreground-tertiary font-mono">
                tpmjs.com/mcp/c/{'{uid}'}
              </code>
            </div>
            <div className="p-4 bg-surface-secondary rounded-lg">
              <p className="font-medium text-foreground">Individual Tool MCP URL</p>
              <code className="text-xs text-foreground-tertiary font-mono">
                tpmjs.com/mcp/t/{'{tool-slug}'}
              </code>
            </div>
          </div>
          <p className="text-sm text-foreground-tertiary mt-4">
            You can also use individual tools without creating a collection!
          </p>
        </div>
      </div>
    ),
  },
];

export default function McpTutorialPage(): React.ReactElement {
  const [currentSlide, setCurrentSlide] = useState(0);

  const goToSlide = (index: number) => {
    setCurrentSlide(Math.max(0, Math.min(slides.length - 1, index)));
  };

  const nextSlide = () => goToSlide(currentSlide + 1);
  const prevSlide = () => goToSlide(currentSlide - 1);

  const slide = slides[currentSlide];
  const progress = ((currentSlide + 1) / slides.length) * 100;

  if (!slide) {
    return <></>;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader />

      {/* Progress bar */}
      <div className="w-full h-1 bg-surface-secondary">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <main className="flex-1 flex flex-col">
        {/* Navigation header */}
        <div className="border-b border-border">
          <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
            <Link
              href="/docs/tutorials"
              className="flex items-center gap-2 text-foreground-secondary hover:text-foreground transition-colors"
            >
              <Icon icon="arrowLeft" size="sm" />
              <span>Back to Tutorials</span>
            </Link>
            <div className="text-sm text-foreground-secondary">
              {currentSlide + 1} / {slides.length}
            </div>
          </div>
        </div>

        {/* Slide content */}
        <div className="flex-1 flex items-center justify-center px-4 py-8">
          <div className="w-full max-w-5xl">
            {/* Slide header */}
            <div className="text-center mb-12">
              {slide.icon && <span className="text-6xl mb-4 block">{slide.icon}</span>}
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">{slide.title}</h1>
              {slide.subtitle && (
                <p className="text-lg text-foreground-secondary">{slide.subtitle}</p>
              )}
            </div>

            {/* Slide content */}
            <div className="mb-12">{slide.content}</div>
          </div>
        </div>

        {/* Navigation footer */}
        <div className="border-t border-border">
          <div className="max-w-6xl mx-auto px-4 py-4">
            {/* Slide indicators */}
            <div className="flex justify-center gap-2 mb-4">
              {slides.map((s, index) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => goToSlide(index)}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    index === currentSlide
                      ? 'bg-primary'
                      : index < currentSlide
                        ? 'bg-primary/40'
                        : 'bg-surface-secondary'
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>

            {/* Navigation buttons */}
            <div className="flex items-center justify-between">
              <Button
                variant="secondary"
                onClick={prevSlide}
                disabled={currentSlide === 0}
                className="min-w-[120px]"
              >
                <Icon icon="arrowLeft" size="xs" className="mr-2" />
                Previous
              </Button>

              {currentSlide === slides.length - 1 ? (
                <Link href="/dashboard/collections">
                  <Button className="min-w-[120px]">Get Started →</Button>
                </Link>
              ) : (
                <Button onClick={nextSlide} className="min-w-[120px]">
                  Next →
                </Button>
              )}
            </div>
          </div>
        </div>
      </main>

      <AppFooter />
    </div>
  );
}
