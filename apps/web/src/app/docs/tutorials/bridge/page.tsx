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
    title: 'Connect Local Tools to TPMJS',
    subtitle: 'Use the Bridge to run MCP servers on your machine',
    icon: '🌉',
    content: (
      <div className="text-center space-y-6">
        <p className="text-xl text-foreground-secondary max-w-2xl mx-auto">
          The TPMJS Bridge lets you connect local MCP servers—like Chrome DevTools, filesystem
          access, or custom tools—to your TPMJS collections.
        </p>
        <div className="flex flex-wrap justify-center gap-4 mt-8">
          <div className="flex items-center gap-2 px-4 py-2 bg-surface-secondary rounded-full">
            <span>🖥️</span>
            <span className="text-sm">Local MCP Servers</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-surface-secondary rounded-full">
            <span>🌉</span>
            <span className="text-sm">Bridge CLI</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-surface-secondary rounded-full">
            <span>☁️</span>
            <span className="text-sm">TPMJS Cloud</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-surface-secondary rounded-full">
            <span>🤖</span>
            <span className="text-sm">AI Access</span>
          </div>
        </div>
        <div className="pt-6">
          <p className="text-sm text-foreground-tertiary">
            Use cases: Chrome automation • Local file access • Database queries • Custom APIs
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 'why-bridge',
    title: 'Why Use the Bridge?',
    subtitle: 'Access tools that require local execution',
    icon: '🤔',
    content: (
      <div className="space-y-8">
        <div className="max-w-3xl mx-auto grid md:grid-cols-2 gap-8">
          <div className="p-6 bg-surface-secondary rounded-lg border border-border">
            <h4 className="text-lg font-semibold text-foreground mb-3">Cloud-Only Tools</h4>
            <ul className="space-y-3 text-foreground-secondary">
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>Code execution (sandboxed)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>Web fetching</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>Web search</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 mt-0.5">✗</span>
                <span>Browser automation</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 mt-0.5">✗</span>
                <span>Local file access</span>
              </li>
            </ul>
          </div>
          <div className="p-6 bg-primary/5 rounded-lg border border-primary/20">
            <h4 className="text-lg font-semibold text-foreground mb-3">With Bridge</h4>
            <ul className="space-y-3 text-foreground-secondary">
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>Chrome DevTools control</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>Read/write local files</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>Local database access</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>Custom internal APIs</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>Any stdio MCP server</span>
              </li>
            </ul>
          </div>
        </div>
        <div className="text-center">
          <p className="text-foreground-secondary">
            The Bridge runs on your machine and securely proxies tool calls from TPMJS.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 'how-it-works',
    title: 'How It Works',
    subtitle: 'A simple proxy between local tools and TPMJS',
    icon: '⚙️',
    content: (
      <div className="space-y-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-surface-secondary rounded-lg border border-border p-6">
            <pre className="text-sm text-foreground-secondary font-mono overflow-x-auto whitespace-pre">
              {`┌─────────────────────────────────────────────────────────────┐
│                     Your Machine                             │
│                                                              │
│  ┌─────────────┐     ┌─────────────────────────────────┐    │
│  │ Chrome MCP  │────▶│                                 │    │
│  │   Server    │     │      @tpmjs/bridge CLI          │    │
│  └─────────────┘     │                                 │    │
│  ┌─────────────┐     │  • Connects to MCP servers      │    │
│  │ Filesystem  │────▶│  • Registers tools with TPMJS   │    │
│  │   Server    │     │  • Polls for tool calls         │    │
│  └─────────────┘     │  • Returns results              │    │
│  ┌─────────────┐     │                                 │    │
│  │ Your Custom │────▶│                                 │    │
│  │   Server    │     └──────────────┬──────────────────┘    │
│  └─────────────┘                    │                        │
└─────────────────────────────────────┼────────────────────────┘
                                      │ HTTPS
                                      ▼
                            ┌─────────────────┐
                            │   TPMJS Cloud   │
                            │                 │
                            │  Your AI uses   │
                            │  bridge tools   │
                            └─────────────────┘`}
            </pre>
          </div>
        </div>
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-foreground-secondary">
            The bridge polls TPMJS for tool calls, executes them locally, and returns results. Tools
            run on <strong>your machine</strong> with <strong>your permissions</strong>.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 'step-1-install',
    title: 'Step 1: Install the Bridge',
    subtitle: 'Install the CLI globally',
    icon: '📦',
    content: (
      <div className="space-y-8">
        <p className="text-lg text-foreground-secondary text-center max-w-2xl mx-auto">
          Install the TPMJS Bridge CLI using npm, pnpm, or yarn.
        </p>
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="bg-background rounded-lg border border-border overflow-hidden">
            <div className="px-4 py-2 bg-surface-secondary border-b border-border flex items-center gap-2">
              <span className="text-foreground-tertiary">$</span>
              <span className="text-sm font-medium text-foreground">Terminal</span>
            </div>
            <pre className="p-4 text-sm overflow-x-auto">
              <code className="text-foreground-secondary">{`# Using npm
npm install -g @tpmjs/bridge

# Using pnpm
pnpm add -g @tpmjs/bridge

# Using yarn
yarn global add @tpmjs/bridge`}</code>
            </pre>
          </div>
          <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <p className="text-sm text-foreground">
              <strong>Verify installation:</strong> Run{' '}
              <code className="bg-background px-1.5 py-0.5 rounded text-xs">
                tpmjs-bridge --version
              </code>
            </p>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'step-2-init',
    title: 'Step 2: Initialize Configuration',
    subtitle: 'Create your bridge config file',
    icon: '⚡',
    content: (
      <div className="space-y-8">
        <p className="text-lg text-foreground-secondary text-center max-w-2xl mx-auto">
          Initialize the bridge to create a config file at{' '}
          <code className="bg-surface-secondary px-2 py-0.5 rounded">~/.tpmjs/bridge.json</code>
        </p>
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="bg-background rounded-lg border border-border overflow-hidden">
            <div className="px-4 py-2 bg-surface-secondary border-b border-border">
              <span className="text-sm font-medium text-foreground">Terminal</span>
            </div>
            <pre className="p-4 text-sm overflow-x-auto">
              <code className="text-foreground-secondary">{`$ tpmjs-bridge init

✓ Created config file: ~/.tpmjs/bridge.json

Edit the config file to add your MCP servers, then run:
  tpmjs-bridge login
  tpmjs-bridge start`}</code>
            </pre>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'step-3-add-server',
    title: 'Step 3: Add MCP Servers',
    subtitle: 'Configure the MCP servers you want to connect',
    icon: '➕',
    content: (
      <div className="space-y-8">
        <p className="text-lg text-foreground-secondary text-center max-w-2xl mx-auto">
          Add MCP servers to your bridge config. Each server runs locally via stdio.
        </p>
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="bg-background rounded-lg border border-border overflow-hidden">
            <div className="px-4 py-2 bg-surface-secondary border-b border-border">
              <span className="text-sm font-medium text-foreground">Add Chrome DevTools MCP</span>
            </div>
            <pre className="p-4 text-sm overflow-x-auto">
              <code className="text-foreground-secondary">{`$ tpmjs-bridge add chrome-devtools \\
    --command "npx" \\
    --args "-y @anthropic/claude-in-chrome"

✓ Added server: chrome-devtools`}</code>
            </pre>
          </div>
          <div className="bg-background rounded-lg border border-border overflow-hidden">
            <div className="px-4 py-2 bg-surface-secondary border-b border-border">
              <span className="text-sm font-medium text-foreground">
                Or edit ~/.tpmjs/bridge.json directly
              </span>
            </div>
            <pre className="p-4 text-sm overflow-x-auto">
              <code className="text-foreground-secondary">{`{
  "servers": [
    {
      "id": "chrome-devtools",
      "name": "Chrome DevTools",
      "transport": "stdio",
      "command": "npx",
      "args": ["-y", "@anthropic/claude-in-chrome"]
    },
    {
      "id": "filesystem",
      "name": "Filesystem Access",
      "transport": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/allowed/dir"]
    }
  ]
}`}</code>
            </pre>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'step-4-login',
    title: 'Step 4: Authenticate',
    subtitle: 'Connect the bridge to your TPMJS account',
    icon: '🔐',
    content: (
      <div className="space-y-8">
        <p className="text-lg text-foreground-secondary text-center max-w-2xl mx-auto">
          Log in to associate the bridge with your TPMJS account.
        </p>
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="bg-background rounded-lg border border-border overflow-hidden">
            <div className="px-4 py-2 bg-surface-secondary border-b border-border">
              <span className="text-sm font-medium text-foreground">Terminal</span>
            </div>
            <pre className="p-4 text-sm overflow-x-auto">
              <code className="text-foreground-secondary">{`$ tpmjs-bridge login

Opening browser for authentication...
✓ Logged in as yourname@example.com`}</code>
            </pre>
          </div>
          <div className="p-4 bg-surface-secondary rounded-lg">
            <p className="text-sm text-foreground-secondary">
              <strong>Alternative:</strong> Pass a token directly with{' '}
              <code className="bg-background px-1.5 py-0.5 rounded text-xs">
                --token YOUR_TOKEN
              </code>
            </p>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'step-5-start',
    title: 'Step 5: Start the Bridge',
    subtitle: 'Run the bridge to connect your tools',
    icon: '🚀',
    content: (
      <div className="space-y-8">
        <p className="text-lg text-foreground-secondary text-center max-w-2xl mx-auto">
          Start the bridge and it will connect to your MCP servers and register tools with TPMJS.
        </p>
        <div className="max-w-3xl mx-auto">
          <div className="bg-background rounded-lg border border-border overflow-hidden">
            <div className="px-4 py-2 bg-surface-secondary border-b border-border">
              <span className="text-sm font-medium text-foreground">Terminal</span>
            </div>
            <pre className="p-4 text-sm overflow-x-auto">
              <code className="text-foreground-secondary">{`$ tpmjs-bridge start

[10:30:15] Starting TPMJS Bridge...

[10:30:15] Connecting to MCP servers:
[10:30:15]   Starting Chrome DevTools...
[10:30:16]   ✓ chrome-devtools connected
[10:30:16]   ✓ Chrome DevTools: 12 tools
[10:30:16]     - screenshot
[10:30:16]     - click_element
[10:30:16]     - navigate
[10:30:16]     - ...and 9 more

[10:30:16] Connecting to TPMJS...
[10:30:17] ✓ Registered 12 tools with TPMJS
[10:30:17]
[10:30:17] Bridge running. Press Ctrl+C to stop.
[10:30:17] Tools are now available in your TPMJS collections.`}</code>
            </pre>
          </div>
        </div>
        <div className="text-center">
          <p className="text-foreground-secondary text-sm">
            Keep the bridge running while you want to use local tools.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 'step-6-add-to-collection',
    title: 'Step 6: Add Bridge Tools to Collections',
    subtitle: 'Include bridge tools in your MCP collections',
    icon: '📦',
    content: (
      <div className="space-y-8">
        <p className="text-lg text-foreground-secondary text-center max-w-2xl mx-auto">
          Once connected, add bridge tools to your collections from the dashboard.
        </p>
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-start gap-4 p-4 bg-surface-secondary rounded-lg">
            <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center text-primary font-bold">
              1
            </div>
            <div>
              <p className="text-foreground font-medium">Go to Dashboard → Bridge</p>
              <p className="text-foreground-secondary text-sm">
                Verify your bridge is connected and see available tools
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4 p-4 bg-surface-secondary rounded-lg">
            <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center text-primary font-bold">
              2
            </div>
            <div>
              <p className="text-foreground font-medium">Open a Collection</p>
              <p className="text-foreground-secondary text-sm">
                Go to the collection where you want bridge tools
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4 p-4 bg-surface-secondary rounded-lg">
            <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center text-primary font-bold">
              3
            </div>
            <div>
              <p className="text-foreground font-medium">Add Bridge Tools</p>
              <p className="text-foreground-secondary text-sm">
                Select tools from your connected MCP servers to add to the collection
              </p>
            </div>
          </div>
        </div>
        <div className="text-center">
          <Link href="/dashboard/settings/bridge">
            <Button variant="default">Check Bridge Status →</Button>
          </Link>
        </div>
      </div>
    ),
  },
  {
    id: 'step-7-use',
    title: 'Step 7: Use Your Tools!',
    subtitle: 'Bridge tools work just like any other TPMJS tool',
    icon: '🎉',
    content: (
      <div className="space-y-8">
        <p className="text-lg text-foreground-secondary text-center max-w-2xl mx-auto">
          Now you can use bridge tools from Claude Desktop, Cursor, or any MCP client!
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
                  <p className="text-sm">Take a screenshot of the current Chrome tab</p>
                </div>
              </div>
              <div className="flex justify-start">
                <div className="bg-background rounded-lg px-4 py-2 max-w-[80%] border border-border">
                  <p className="text-xs text-primary mb-2">
                    Using tool: bridge--chrome-devtools--screenshot
                  </p>
                  <p className="text-sm text-foreground">Here&apos;s the screenshot:</p>
                  <div className="mt-2 p-4 bg-surface-secondary rounded border border-border text-center text-foreground-tertiary">
                    [Screenshot image]
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-center gap-3 text-sm text-foreground-secondary">
          <span className="flex items-center gap-1">
            <span className="text-green-500">✓</span> Chrome automation
          </span>
          <span className="flex items-center gap-1">
            <span className="text-green-500">✓</span> Local files
          </span>
          <span className="flex items-center gap-1">
            <span className="text-green-500">✓</span> Custom tools
          </span>
        </div>
      </div>
    ),
  },
  {
    id: 'commands',
    title: 'CLI Reference',
    subtitle: 'All available bridge commands',
    icon: '📖',
    content: (
      <div className="space-y-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-background rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-secondary border-b border-border">
                  <th className="text-left px-4 py-3 font-medium text-foreground">Command</th>
                  <th className="text-left px-4 py-3 font-medium text-foreground">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr>
                  <td className="px-4 py-3 font-mono text-foreground-secondary">
                    tpmjs-bridge init
                  </td>
                  <td className="px-4 py-3 text-foreground-secondary">Create config file</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-mono text-foreground-secondary">
                    tpmjs-bridge login
                  </td>
                  <td className="px-4 py-3 text-foreground-secondary">Authenticate with TPMJS</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-mono text-foreground-secondary">
                    tpmjs-bridge logout
                  </td>
                  <td className="px-4 py-3 text-foreground-secondary">Remove credentials</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-mono text-foreground-secondary">
                    tpmjs-bridge add &lt;name&gt;
                  </td>
                  <td className="px-4 py-3 text-foreground-secondary">Add an MCP server</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-mono text-foreground-secondary">
                    tpmjs-bridge remove &lt;name&gt;
                  </td>
                  <td className="px-4 py-3 text-foreground-secondary">Remove an MCP server</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-mono text-foreground-secondary">
                    tpmjs-bridge list
                  </td>
                  <td className="px-4 py-3 text-foreground-secondary">List configured servers</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-mono text-foreground-secondary">
                    tpmjs-bridge start
                  </td>
                  <td className="px-4 py-3 text-foreground-secondary">Start the bridge</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-mono text-foreground-secondary">
                    tpmjs-bridge status
                  </td>
                  <td className="px-4 py-3 text-foreground-secondary">Show connection status</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-mono text-foreground-secondary">
                    tpmjs-bridge config
                  </td>
                  <td className="px-4 py-3 text-foreground-secondary">Show config file path</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'complete',
    title: 'Bridge Connected!',
    subtitle: 'Your local tools are now accessible via TPMJS',
    icon: '🌉',
    content: (
      <div className="space-y-8 text-center">
        <p className="text-xl text-foreground-secondary max-w-2xl mx-auto">
          Your bridge is set up! Local MCP servers can now be used through TPMJS.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link href="/dashboard/settings/bridge">
            <Button size="lg">View Bridge Status</Button>
          </Link>
          <Link href="/dashboard/collections">
            <Button variant="secondary" size="lg">
              Manage Collections
            </Button>
          </Link>
        </div>
        <div className="max-w-2xl mx-auto pt-8 border-t border-border mt-8">
          <h4 className="text-lg font-semibold text-foreground mb-4">Tips</h4>
          <div className="grid md:grid-cols-2 gap-4 text-left">
            <div className="p-4 bg-surface-secondary rounded-lg">
              <p className="font-medium text-foreground">Keep Bridge Running</p>
              <p className="text-sm text-foreground-tertiary">
                Bridge tools only work while the CLI is running
              </p>
            </div>
            <div className="p-4 bg-surface-secondary rounded-lg">
              <p className="font-medium text-foreground">Run on Startup</p>
              <p className="text-sm text-foreground-tertiary">
                Add to your shell profile or use a process manager
              </p>
            </div>
          </div>
        </div>
      </div>
    ),
  },
];

export default function BridgeTutorialPage(): React.ReactElement {
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
                <Link href="/dashboard/settings/bridge">
                  <Button className="min-w-[120px]">View Bridge Status →</Button>
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
