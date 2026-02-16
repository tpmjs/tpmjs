'use client';

import { Badge } from '@tpmjs/ui/Badge/Badge';
import { CodeBlock } from '@tpmjs/ui/CodeBlock/CodeBlock';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AppHeader } from '~/components/AppHeader';

// ─── Navigation ─────────────────────────────────────────────────────────────

const NAV_SECTIONS = [
  {
    title: 'Overview',
    items: [
      { id: 'introduction', label: 'Introduction' },
      { id: 'when-to-use', label: 'When to Use' },
      { id: 'how-it-works', label: 'How It Works' },
    ],
  },
  {
    title: 'Shell Tools',
    items: [
      { id: 'shell-exec', label: 'shellExec' },
      { id: 'read-file', label: 'readFile' },
      { id: 'write-file', label: 'writeFile' },
      { id: 'list-files', label: 'listFiles' },
    ],
  },
  {
    title: 'Sessions',
    items: [
      { id: 'session-lifecycle', label: 'Session Lifecycle' },
      { id: 'session-api', label: 'Session API' },
    ],
  },
  {
    title: 'Configuration',
    items: [
      { id: 'executor-config', label: 'Sandbox Config' },
      { id: 'environment-variables', label: 'Environment Variables' },
      { id: 'git-integration', label: 'Git Integration' },
    ],
  },
  {
    title: 'Deployment',
    items: [
      { id: 'deploy-railway', label: 'Deploy to Railway' },
      { id: 'deploy-docker', label: 'Deploy with Docker' },
      { id: 'connect-web-app', label: 'Connect to TPMJS' },
    ],
  },
  {
    title: 'Reference',
    items: [
      { id: 'security', label: 'Security Model' },
      { id: 'limits', label: 'Limits & Quotas' },
      { id: 'execute-tool-api', label: 'Execute Tool API' },
      { id: 'health-metrics', label: 'Health & Metrics' },
    ],
  },
];

// ─── Code Snippets ──────────────────────────────────────────────────────────

const architectureDiagram = `User Message
  │
  ▼
┌─────────────────────────────────────┐
│  TPMJS Web App (Next.js)            │
│                                     │
│  1. Create/resume sandbox session   │
│  2. Stream AI response              │
│  3. Route tool calls to sandbox     │
│  4. Persist messages to DB          │
└──────────────┬──────────────────────┘
               │  POST /execute-tool
               │  { sessionId, params }
               ▼
┌─────────────────────────────────────┐
│  Agent Sandbox Server (Deno)        │
│                                     │
│  Session: agent123:conv456          │
│  ┌───────────────────────────────┐  │
│  │  /workspace/                  │  │
│  │  ├── my-repo/                 │  │
│  │  │   ├── .git/                │  │
│  │  │   ├── src/                 │  │
│  │  │   └── README.md            │  │
│  │  └── notes.txt                │  │
│  └───────────────────────────────┘  │
│                                     │
│  Inject _sandboxWorkDir → execute   │
└─────────────────────────────────────┘`;

const shellExecExample = `// Agent calls shellExec
{
  "command": "git clone https://github.com/user/repo.git --depth 1",
  "timeout": 60000
}`;

const shellExecResponse = `{
  "stdout": "Cloning into 'repo'...\\n",
  "stderr": "",
  "exitCode": 0,
  "durationMs": 2341,
  "truncated": false
}`;

const readFileExample = `// Agent calls readFile
{
  "path": "repo/src/index.ts"
}`;

const readFileResponse = `{
  "content": "export function hello() {\\n  return 'world';\\n}\\n",
  "path": "repo/src/index.ts",
  "size": 48,
  "truncated": false
}`;

const writeFileExample = `// Agent calls writeFile
{
  "path": "src/main.py",
  "content": "import json\\n\\ndef transform(data):\\n    return json.dumps(data)\\n",
  "createDirs": true
}`;

const writeFileResponse = `{
  "success": true,
  "path": "src/main.py",
  "bytesWritten": 58
}`;

const listFilesExample = `// Agent calls listFiles
{
  "path": ".",
  "recursive": true,
  "maxDepth": 2
}`;

const listFilesResponse = `{
  "path": ".",
  "entries": [
    { "name": "repo", "type": "directory", "size": null },
    { "name": "repo/README.md", "type": "file", "size": 1024 },
    { "name": "repo/src", "type": "directory", "size": null },
    { "name": "repo/src/index.ts", "type": "file", "size": 48 },
    { "name": "src", "type": "directory", "size": null },
    { "name": "src/main.py", "type": "file", "size": 58 }
  ],
  "truncated": false
}`;

const createSessionCurl = `curl -X POST https://your-sandbox.up.railway.app/sessions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer $EXECUTOR_API_KEY" \\
  -d '{"sessionId": "agent123:conv456", "timeoutSeconds": 3600}'`;

const createSessionResponse = `{
  "sessionId": "agent123:conv456",
  "workDir": "/tmp/tpmjs-sandbox/sessions/agent123_conv456/workspace",
  "createdAt": "2026-02-16T10:00:00.000Z",
  "expiresAt": "2026-02-16T11:00:00.000Z",
  "resumed": false
}`;

const getSessionCurl = `curl https://your-sandbox.up.railway.app/sessions/agent123:conv456 \\
  -H "Authorization: Bearer $EXECUTOR_API_KEY"`;

const getSessionResponse = `{
  "sessionId": "agent123:conv456",
  "workDir": "/tmp/tpmjs-sandbox/sessions/agent123_conv456/workspace",
  "createdAt": "2026-02-16T10:00:00.000Z",
  "expiresAt": "2026-02-16T11:00:00.000Z",
  "toolCallCount": 7
}`;

const destroySessionCurl = `curl -X DELETE https://your-sandbox.up.railway.app/sessions/agent123:conv456 \\
  -H "Authorization: Bearer $EXECUTOR_API_KEY"`;

const executeToolCurl = `curl -X POST https://your-sandbox.up.railway.app/execute-tool \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer $EXECUTOR_API_KEY" \\
  -d '{
    "packageName": "@tpmjs/official-sandbox-shell",
    "name": "shellExec",
    "version": "0.1.0",
    "params": { "command": "ls -la" },
    "sessionId": "agent123:conv456",
    "env": { "MY_VAR": "value" }
  }'`;

const executeToolResponse = `{
  "success": true,
  "output": {
    "stdout": "total 8\\ndrwxr-xr-x 3 deno deno 4096 ...\\n",
    "stderr": "",
    "exitCode": 0,
    "durationMs": 12,
    "truncated": false
  },
  "executionTimeMs": 45
}`;

const healthResponse = `{
  "status": "ok",
  "version": "1.0.0",
  "info": {
    "runtime": "deno",
    "denoVersion": "2.1.9",
    "activeSessions": 3,
    "maxSessions": 50,
    "cachedModules": 12,
    "capabilities": {
      "sessions": true,
      "executeToolWithSession": true
    }
  }
}`;

const metricsResponse = `{
  "uptime": 3600000,
  "sessions": {
    "active": 3,
    "max": 50,
    "totalCreated": 150,
    "totalDestroyed": 147
  },
  "executions": {
    "total": 1024,
    "successful": 1010,
    "failed": 14
  },
  "memory": {
    "rss": 67108864,
    "heapUsed": 45000000,
    "heapTotal": 60000000
  },
  "cache": {
    "modules": 12,
    "maxSize": 200
  }
}`;

const executorConfigExample = `// Enable sandbox on an agent via the API:
PATCH /api/agents/:id
{
  "sandboxEnabled": true
}

// Sandbox URL and API key are configured via environment variables:
// AGENT_SANDBOX_URL=https://your-sandbox.up.railway.app
// AGENT_SANDBOX_API_KEY=your-secret-key`;

const executorCascade = `// Resolution order (highest to lowest priority):
Agent.executorConfig     →  applies to ALL tools
Collection.executorConfig →  applies to tools in that collection
System default           →  stateless package-executor`;

const envMergeExample = `// Collection envVars (base)
{ "API_KEY": "coll-key", "REGION": "us-east-1" }

// Agent envVars (overrides)
{ "API_KEY": "agent-key", "DEBUG": "true" }

// Merged result
{ "API_KEY": "agent-key", "REGION": "us-east-1", "DEBUG": "true" }`;

const railwayDeploy = `# Clone the template
git clone https://github.com/tpmjs/tpmjs.git
cd tpmjs/templates/agent-sandbox

# Deploy to Railway
npm install -g @railway/cli
railway login
railway init
railway up

# Set env vars in Railway dashboard:
#   EXECUTOR_API_KEY=your-secret
#   GITHUB_TOKEN=ghp_... (optional, for private repos)`;

const dockerDeploy = `# Build
docker build -t tpmjs-sandbox .

# Run
docker run -p 3002:3002 \\
  -e EXECUTOR_API_KEY=your-secret-key \\
  -e GITHUB_TOKEN=ghp_optional \\
  tpmjs-sandbox`;

const localDev = `# Run locally (no auth)
cd templates/agent-sandbox
deno run --allow-net --allow-env --allow-read --allow-write=/tmp --allow-run server.ts

# Quick test
curl http://localhost:3002/health | jq .`;

const multiStepExample = `// Turn 1: User says "Clone the repo and show me the README"
// Agent calls:
shellExec({ command: "git clone https://github.com/user/repo.git --depth 1" })
readFile({ path: "repo/README.md" })

// Turn 2: User says "Add a license file"
// Agent calls (files from turn 1 still exist):
writeFile({ path: "repo/LICENSE", content: "MIT License..." })
shellExec({ command: "cd repo && git add LICENSE && git commit -m 'Add license'" })

// Turn 3: User says "Show me the git log"
// Agent calls (all prior changes persist):
shellExec({ command: "cd repo && git log --oneline" })`;

// ─── Reusable Components ────────────────────────────────────────────────────

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

function EnvVarTable({
  vars,
}: {
  vars: { name: string; default_: string; description: string }[];
}) {
  return (
    <div className="overflow-x-auto border border-border rounded-lg">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-surface">
            <th className="text-left py-3 px-4 text-foreground font-medium">Variable</th>
            <th className="text-left py-3 px-4 text-foreground font-medium">Default</th>
            <th className="text-left py-3 px-4 text-foreground font-medium">Description</th>
          </tr>
        </thead>
        <tbody>
          {vars.map((v, i) => (
            <tr key={v.name} className={i !== vars.length - 1 ? 'border-b border-border' : ''}>
              <td className="py-3 px-4 font-mono text-xs text-primary">{v.name}</td>
              <td className="py-3 px-4 font-mono text-xs text-foreground-secondary">
                {v.default_ || '—'}
              </td>
              <td className="py-3 px-4 text-foreground-secondary">{v.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function SandboxExecutorPage(): React.ReactElement {
  const [activeSection, setActiveSection] = useState('introduction');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        }
      },
      { rootMargin: '-100px 0px -66%' }
    );

    for (const section of NAV_SECTIONS) {
      for (const item of section.items) {
        const element = document.getElementById(item.id);
        if (element) observer.observe(element);
      }
    }

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
            <span className="text-lg">{mobileNavOpen ? '\u2715' : '\u2630'}</span>
            <span>Agent Sandbox</span>
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
                href="/docs/executors"
                className="text-sm text-foreground-secondary hover:text-foreground mb-2 block"
              >
                &larr; Back to Executors
              </Link>
              <h2 className="text-lg font-bold text-foreground">Agent Sandbox</h2>
              <p className="text-sm text-foreground-tertiary">Stateful tool execution</p>
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
                Agent Sandbox
              </h1>
              <p className="text-xl text-foreground-secondary mb-6">
                Persistent filesystem sessions for TPMJS agents. Clone repos, edit files, run
                commands &mdash; all state preserved across tool calls within a conversation.
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="default">Stateful Sessions</Badge>
                <Badge variant="secondary">Git Support</Badge>
                <Badge variant="secondary">Shell Execution</Badge>
                <Badge variant="secondary">File I/O</Badge>
                <Badge variant="secondary">Self-hostable</Badge>
              </div>
            </div>

            {/* ─── Introduction ──────────────────────────────────────── */}

            <DocSection id="introduction" title="Introduction">
              <p className="text-foreground-secondary mb-4">
                The Agent Sandbox is a Deno-based execution server that gives each agent
                conversation its own{' '}
                <strong className="text-foreground">persistent workspace directory</strong>. Unlike
                the default stateless executor where each tool call is independent, the sandbox
                preserves files across tool calls so agents can perform multi-step workflows.
              </p>
              <p className="text-foreground-secondary mb-6">
                A file written in the first turn of a conversation is still there in the tenth turn.
                A git repo cloned in one step can be modified and committed in the next. This is
                what makes agentic coding workflows possible.
              </p>
              <CodeBlock code={architectureDiagram} language="text" />
            </DocSection>

            {/* ─── When to Use ───────────────────────────────────────── */}

            <DocSection id="when-to-use" title="When to Use the Sandbox">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <InfoCard icon="🔧" title="Multi-step Workflows">
                  Generate files in one step, process them in the next. Build pipelines that span
                  multiple tool calls.
                </InfoCard>
                <InfoCard icon="📂" title="Git Operations">
                  Clone repositories, make changes, commit, and push. The full git workflow within a
                  conversation.
                </InfoCard>
                <InfoCard icon="💾" title="File-based Processing">
                  Tools that read and write files need shared state. CSV analysis, log parsing, code
                  generation &mdash; all work naturally.
                </InfoCard>
                <InfoCard icon="🏗️" title="Code Generation & Testing">
                  Generate code in one step, run tests or build it in another. Iterate based on
                  results.
                </InfoCard>
              </div>
              <div className="p-4 bg-surface border border-border rounded-lg">
                <p className="text-sm text-foreground-secondary">
                  <strong className="text-foreground">Don&apos;t need statefulness?</strong> Use the
                  default executor. It&apos;s simpler, faster, and doesn&apos;t require a separate
                  server. The sandbox is specifically for workflows where files must persist between
                  tool calls.
                </p>
              </div>
            </DocSection>

            {/* ─── How It Works ──────────────────────────────────────── */}

            <DocSection id="how-it-works" title="How It Works">
              <p className="text-foreground-secondary mb-6">
                Here&apos;s a multi-turn conversation showing how state persists:
              </p>
              <CodeBlock code={multiStepExample} language="typescript" />
              <div className="mt-6 space-y-4">
                <DocSubSection title="End-to-End Flow">
                  <ol className="space-y-3 text-foreground-secondary">
                    {[
                      'User sends a message to an agent with sandbox enabled',
                      'The conversation route creates or resumes a sandbox session (ID: agentId:conversationId)',
                      'The AI model decides which tools to call based on the user message',
                      'Tool calls are routed to the sandbox server with the session ID',
                      'The sandbox server resolves the session workspace and injects _sandboxWorkDir into params',
                      'The tool executes in the workspace directory — files persist on disk',
                      'Results flow back to the AI model, which may call more tools or respond with text',
                      'All messages, tool calls, and results are persisted to the database',
                    ].map((step, i) => (
                      <li key={step} className="flex gap-3">
                        <span className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                          <span className="text-xs font-bold text-primary">{i + 1}</span>
                        </span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </DocSubSection>
              </div>
            </DocSection>

            {/* ─── Shell Tools ────────────────────────────────────────── */}

            <DocSection id="shell-exec" title="shellExec">
              <p className="text-foreground-secondary mb-4">
                Execute any shell command in the workspace. Supports git, npm, python, and any CLI
                tool available in the container.
              </p>
              <DocSubSection title="Parameters">
                <ParamTable
                  params={[
                    {
                      name: 'command',
                      type: 'string',
                      required: true,
                      description: 'Shell command passed to sh -c',
                    },
                    {
                      name: 'timeout',
                      type: 'number',
                      required: false,
                      description: 'Timeout in milliseconds (default: 30000, max: 300000)',
                    },
                  ]}
                />
              </DocSubSection>
              <DocSubSection title="Example">
                <CodeBlock code={shellExecExample} language="json" />
                <p className="text-sm text-foreground-secondary mt-3 mb-2">Response:</p>
                <CodeBlock code={shellExecResponse} language="json" />
              </DocSubSection>
              <div className="p-4 bg-surface border border-border rounded-lg text-sm text-foreground-secondary space-y-1">
                <p>
                  <strong className="text-foreground">Timeout behavior:</strong> On timeout, sends
                  SIGTERM, waits 2 seconds, then SIGKILL. Exit code 137 indicates a timeout kill.
                </p>
                <p>
                  <strong className="text-foreground">Output truncation:</strong> stdout and stderr
                  are each truncated at 100 KB.
                </p>
              </div>
            </DocSection>

            <DocSection id="read-file" title="readFile">
              <p className="text-foreground-secondary mb-4">
                Read a file from the workspace. Paths are relative to the workspace root.
              </p>
              <DocSubSection title="Parameters">
                <ParamTable
                  params={[
                    {
                      name: 'path',
                      type: 'string',
                      required: true,
                      description: 'File path relative to workspace root',
                    },
                  ]}
                />
              </DocSubSection>
              <DocSubSection title="Example">
                <CodeBlock code={readFileExample} language="json" />
                <p className="text-sm text-foreground-secondary mt-3 mb-2">Response:</p>
                <CodeBlock code={readFileResponse} language="json" />
              </DocSubSection>
              <div className="p-4 bg-surface border border-border rounded-lg text-sm text-foreground-secondary">
                Content is truncated at 500 KB. Symlinks that escape the workspace are blocked.
              </div>
            </DocSection>

            <DocSection id="write-file" title="writeFile">
              <p className="text-foreground-secondary mb-4">
                Create or overwrite a file. Parent directories are created automatically by default.
              </p>
              <DocSubSection title="Parameters">
                <ParamTable
                  params={[
                    {
                      name: 'path',
                      type: 'string',
                      required: true,
                      description: 'File path relative to workspace root',
                    },
                    {
                      name: 'content',
                      type: 'string',
                      required: true,
                      description: 'Content to write',
                    },
                    {
                      name: 'createDirs',
                      type: 'boolean',
                      required: false,
                      description: 'Create parent directories if needed (default: true)',
                    },
                  ]}
                />
              </DocSubSection>
              <DocSubSection title="Example">
                <CodeBlock code={writeFileExample} language="json" />
                <p className="text-sm text-foreground-secondary mt-3 mb-2">Response:</p>
                <CodeBlock code={writeFileResponse} language="json" />
              </DocSubSection>
            </DocSection>

            <DocSection id="list-files" title="listFiles">
              <p className="text-foreground-secondary mb-4">
                List files and directories. Supports recursive listing with depth control.
              </p>
              <DocSubSection title="Parameters">
                <ParamTable
                  params={[
                    {
                      name: 'path',
                      type: 'string',
                      required: false,
                      description: 'Directory path relative to workspace root (default: ".")',
                    },
                    {
                      name: 'recursive',
                      type: 'boolean',
                      required: false,
                      description: 'List recursively (default: false)',
                    },
                    {
                      name: 'maxDepth',
                      type: 'number',
                      required: false,
                      description: 'Max depth for recursive listing (default: 3)',
                    },
                  ]}
                />
              </DocSubSection>
              <DocSubSection title="Example">
                <CodeBlock code={listFilesExample} language="json" />
                <p className="text-sm text-foreground-secondary mt-3 mb-2">Response:</p>
                <CodeBlock code={listFilesResponse} language="json" />
              </DocSubSection>
              <div className="p-4 bg-surface border border-border rounded-lg text-sm text-foreground-secondary">
                Capped at 1,000 entries. Symlinks pointing outside the workspace are silently
                skipped.
              </div>
            </DocSection>

            {/* ─── Session Lifecycle ──────────────────────────────────── */}

            <DocSection id="session-lifecycle" title="Session Lifecycle">
              <div className="space-y-4 mb-8">
                {[
                  {
                    step: '1',
                    title: 'Session Created',
                    desc: 'When you send the first message to a sandbox agent, a session is automatically created. The session ID is agentId:conversationId. Each session gets its own workspace directory.',
                  },
                  {
                    step: '2',
                    title: 'TTL Extended on Activity',
                    desc: 'Every tool call extends the session TTL (default: 1 hour). Session creation is idempotent — subsequent messages just extend the timeout and resume the workspace.',
                  },
                  {
                    step: '3',
                    title: 'Files Persist Across Turns',
                    desc: 'All files in the workspace persist between tool calls and conversation turns. Git repos, generated files, build artifacts — everything stays until the session ends.',
                  },
                  {
                    step: '4',
                    title: 'Auto-Expire or Manual Cleanup',
                    desc: 'Sessions expire after the TTL (1 hour of inactivity). Deleting a conversation immediately destroys the session. A cleanup sweep runs every 60 seconds.',
                  },
                ].map((item) => (
                  <div key={item.step} className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-sm font-bold text-primary">{item.step}</span>
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground">{item.title}</h3>
                      <p className="text-sm text-foreground-secondary">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 bg-surface border border-border rounded-lg text-sm text-foreground-secondary">
                <strong className="text-foreground">Orphan cleanup:</strong> On server startup, any
                leftover workspace directories from a previous run are automatically removed.
                Graceful shutdown (SIGTERM/SIGINT) destroys all active sessions.
              </div>
            </DocSection>

            {/* ─── Session API ────────────────────────────────────────── */}

            <DocSection id="session-api" title="Session API">
              <p className="text-foreground-secondary mb-6">
                These endpoints are called automatically by the TPMJS web app. You only need them if
                building a custom integration.
              </p>

              <DocSubSection title="POST /sessions &mdash; Create or Resume">
                <CodeBlock code={createSessionCurl} language="bash" />
                <p className="text-sm text-foreground-secondary mt-3 mb-2">Response:</p>
                <CodeBlock code={createSessionResponse} language="json" />
                <p className="text-sm text-foreground-secondary mt-2">
                  Idempotent: if the session already exists, returns it with{' '}
                  <code className="text-xs bg-surface-elevated px-1 py-0.5 rounded">
                    &quot;resumed&quot;: true
                  </code>{' '}
                  and extends the TTL.
                </p>
              </DocSubSection>

              <DocSubSection title="GET /sessions/:id &mdash; Get Status">
                <CodeBlock code={getSessionCurl} language="bash" />
                <p className="text-sm text-foreground-secondary mt-3 mb-2">Response:</p>
                <CodeBlock code={getSessionResponse} language="json" />
              </DocSubSection>

              <DocSubSection title="DELETE /sessions/:id &mdash; Destroy">
                <CodeBlock code={destroySessionCurl} language="bash" />
                <p className="text-sm text-foreground-secondary mt-2">
                  Immediately removes the session and deletes the workspace directory.
                </p>
              </DocSubSection>
            </DocSection>

            {/* ─── Executor Config ────────────────────────────────────── */}

            <DocSection id="executor-config" title="Sandbox Configuration">
              <p className="text-foreground-secondary mb-4">
                Enable sandbox by toggling the{' '}
                <code className="text-xs bg-surface-elevated px-1 py-0.5 rounded">
                  sandboxEnabled
                </code>{' '}
                switch on your agent. Sandbox is independent of the executor setting &mdash; you can
                use sandbox with either the default executor or a custom one.
              </p>
              <CodeBlock code={executorConfigExample} language="typescript" />

              <DocSubSection title="Config Cascade">
                <p className="text-foreground-secondary mb-3">
                  Executor configuration follows a cascade &mdash; agent-level overrides
                  collection-level, which overrides the system default:
                </p>
                <CodeBlock code={executorCascade} language="typescript" />
              </DocSubSection>

              <div className="overflow-x-auto border border-border rounded-lg">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-surface">
                      <th className="text-left py-3 px-4 text-foreground font-medium" />
                      <th className="text-left py-3 px-4 text-foreground font-medium">
                        TPMJS Default Sandbox
                      </th>
                      <th className="text-left py-3 px-4 text-foreground font-medium">
                        Self-hosted
                      </th>
                    </tr>
                  </thead>
                  <tbody className="text-foreground-secondary">
                    <tr className="border-b border-border">
                      <td className="py-3 px-4 font-medium text-foreground">Setup</td>
                      <td className="py-3 px-4">
                        Zero config &mdash; just toggle &quot;Enable Sandbox&quot;
                      </td>
                      <td className="py-3 px-4">Deploy template to Railway/Docker</td>
                    </tr>
                    <tr className="border-b border-border">
                      <td className="py-3 px-4 font-medium text-foreground">URL</td>
                      <td className="py-3 px-4">Leave URL field empty</td>
                      <td className="py-3 px-4">Enter your sandbox URL</td>
                    </tr>
                    <tr className="border-b border-border">
                      <td className="py-3 px-4 font-medium text-foreground">Data Privacy</td>
                      <td className="py-3 px-4">Shared infrastructure</td>
                      <td className="py-3 px-4">Your infrastructure, your data</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-medium text-foreground">Customization</td>
                      <td className="py-3 px-4">Standard limits</td>
                      <td className="py-3 px-4">Custom TTL, disk quotas, session limits</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </DocSection>

            {/* ─── Environment Variables ──────────────────────────────── */}

            <DocSection id="environment-variables" title="Environment Variables">
              <DocSubSection title="Sandbox Server">
                <EnvVarTable
                  vars={[
                    {
                      name: 'EXECUTOR_API_KEY',
                      default_: '',
                      description: 'Bearer token for authentication. If unset, auth is disabled.',
                    },
                    {
                      name: 'MAX_CONCURRENT_SESSIONS',
                      default_: '50',
                      description: 'Maximum number of active sessions',
                    },
                    {
                      name: 'DEFAULT_SESSION_TTL_SECONDS',
                      default_: '3600',
                      description: 'Session timeout (1 hour)',
                    },
                    {
                      name: 'SESSION_DISK_QUOTA_MB',
                      default_: '100',
                      description: 'Per-session disk quota in MB',
                    },
                    {
                      name: 'PORT',
                      default_: '3002',
                      description: 'Server port',
                    },
                    {
                      name: 'GITHUB_TOKEN',
                      default_: '',
                      description: 'GitHub PAT for cloning private repos via credential helper',
                    },
                  ]}
                />
              </DocSubSection>

              <DocSubSection title="Web App">
                <EnvVarTable
                  vars={[
                    {
                      name: 'AGENT_SANDBOX_URL',
                      default_: '',
                      description:
                        'URL of the sandbox server. Can be overridden per-agent via executorConfig.url.',
                    },
                  ]}
                />
              </DocSubSection>

              <DocSubSection title="Agent Environment Variables">
                <p className="text-foreground-secondary mb-3">
                  Agents and collections can define environment variables that are injected into
                  each tool call. Agent-level env vars override collection-level ones:
                </p>
                <CodeBlock code={envMergeExample} language="typescript" />
                <p className="text-sm text-foreground-secondary mt-3">
                  Env vars are set before each tool execution and cleaned up afterward. They are not
                  persisted across calls.
                </p>
              </DocSubSection>
            </DocSection>

            {/* ─── Git Integration ────────────────────────────────────── */}

            <DocSection id="git-integration" title="Git Integration">
              <p className="text-foreground-secondary mb-4">
                The sandbox container includes git and openssh-client. Agents can clone repos,
                create branches, make commits, and push changes.
              </p>

              <DocSubSection title="Public Repos">
                <p className="text-foreground-secondary mb-2">
                  No configuration needed. Agents can clone any public repo:
                </p>
                <CodeBlock
                  code={
                    'shellExec({ command: "git clone https://github.com/user/repo.git --depth 1" })'
                  }
                  language="typescript"
                />
              </DocSubSection>

              <DocSubSection title="Private Repos">
                <p className="text-foreground-secondary mb-3">
                  Set the{' '}
                  <code className="text-xs bg-surface-elevated px-1 py-0.5 rounded">
                    GITHUB_TOKEN
                  </code>{' '}
                  environment variable on the sandbox server. A built-in credential helper
                  automatically provides the token to git:
                </p>
                <div className="p-4 bg-surface border border-border rounded-lg text-sm text-foreground-secondary">
                  The credential helper reads{' '}
                  <code className="text-xs bg-surface-elevated px-1 py-0.5 rounded">
                    GITHUB_TOKEN
                  </code>{' '}
                  from the server environment and provides it as an{' '}
                  <code className="text-xs bg-surface-elevated px-1 py-0.5 rounded">
                    x-access-token
                  </code>{' '}
                  credential to git. No{' '}
                  <code className="text-xs bg-surface-elevated px-1 py-0.5 rounded">
                    .gitconfig
                  </code>{' '}
                  or SSH key setup needed.
                </div>
              </DocSubSection>
            </DocSection>

            {/* ─── Deploy Railway ─────────────────────────────────────── */}

            <DocSection id="deploy-railway" title="Deploy to Railway">
              <p className="text-foreground-secondary mb-4">
                The fastest way to get a self-hosted sandbox running.
              </p>
              <CodeBlock code={railwayDeploy} language="bash" />
              <p className="text-sm text-foreground-secondary mt-3">
                Set{' '}
                <code className="text-xs bg-surface-elevated px-1 py-0.5 rounded">
                  EXECUTOR_API_KEY
                </code>{' '}
                in the Railway dashboard to secure your instance.
              </p>
            </DocSection>

            {/* ─── Deploy Docker ──────────────────────────────────────── */}

            <DocSection id="deploy-docker" title="Deploy with Docker">
              <CodeBlock code={dockerDeploy} language="bash" />
              <p className="text-sm text-foreground-secondary mt-3">
                The Docker image is based on{' '}
                <code className="text-xs bg-surface-elevated px-1 py-0.5 rounded">
                  denoland/deno:2.1.9
                </code>{' '}
                and includes curl, git, and openssh-client. It runs as a non-root user with write
                access restricted to{' '}
                <code className="text-xs bg-surface-elevated px-1 py-0.5 rounded">/tmp</code>.
              </p>
            </DocSection>

            {/* ─── Connect Web App ────────────────────────────────────── */}

            <DocSection id="connect-web-app" title="Connect to TPMJS">
              <p className="text-foreground-secondary mb-4">
                Point the web app at your sandbox server:
              </p>
              <CodeBlock
                code={
                  '# apps/web/.env.local\nAGENT_SANDBOX_URL=https://your-sandbox.up.railway.app'
                }
                language="bash"
              />
              <p className="text-foreground-secondary mt-4 mb-4">Or for local development:</p>
              <CodeBlock code={localDev} language="bash" />
            </DocSection>

            {/* ─── Security ──────────────────────────────────────────── */}

            <DocSection id="security" title="Security Model">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <InfoCard icon="🔐" title="Authentication">
                  All endpoints except /health and /metrics require a Bearer token when
                  EXECUTOR_API_KEY is set. Disable auth by leaving it unset (dev only).
                </InfoCard>
                <InfoCard icon="📁" title="Path Sandboxing">
                  All file paths are normalized, resolved, and validated to stay within the
                  workspace. Symlinks are checked via realPath(). Escape attempts throw an error.
                </InfoCard>
                <InfoCard icon="👤" title="Process Isolation">
                  Runs as a non-root deno user. Write access is restricted to /tmp. Each session has
                  its own workspace directory. Env vars are cleaned up after each call.
                </InfoCard>
                <InfoCard icon="⏱️" title="Timeout Protection">
                  Shell commands have configurable timeouts (default 30s, max 5min). SIGTERM then
                  SIGKILL. HTTP-level timeout of 5 minutes on executor calls.
                </InfoCard>
              </div>
            </DocSection>

            {/* ─── Limits ────────────────────────────────────────────── */}

            <DocSection id="limits" title="Limits & Quotas">
              <div className="overflow-x-auto border border-border rounded-lg">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-surface">
                      <th className="text-left py-3 px-4 text-foreground font-medium">Resource</th>
                      <th className="text-left py-3 px-4 text-foreground font-medium">Limit</th>
                      <th className="text-left py-3 px-4 text-foreground font-medium">
                        Configurable
                      </th>
                    </tr>
                  </thead>
                  <tbody className="text-foreground-secondary">
                    {[
                      {
                        resource: 'Disk per session',
                        limit: '100 MB',
                        config: 'SESSION_DISK_QUOTA_MB',
                      },
                      {
                        resource: 'Concurrent sessions',
                        limit: '50',
                        config: 'MAX_CONCURRENT_SESSIONS',
                      },
                      {
                        resource: 'Session TTL',
                        limit: '1 hour',
                        config: 'DEFAULT_SESSION_TTL_SECONDS',
                      },
                      {
                        resource: 'Shell command timeout',
                        limit: '30s (max 5min)',
                        config: 'Per tool call',
                      },
                      { resource: 'stdout/stderr', limit: '100 KB each', config: 'No' },
                      { resource: 'File read size', limit: '500 KB', config: 'No' },
                      { resource: 'Directory listing', limit: '1,000 entries', config: 'No' },
                      { resource: 'Module cache', limit: '200 entries, 2min TTL', config: 'No' },
                    ].map((row, i) => (
                      <tr key={row.resource} className={i < 7 ? 'border-b border-border' : ''}>
                        <td className="py-3 px-4 font-medium text-foreground">{row.resource}</td>
                        <td className="py-3 px-4 font-mono text-xs">{row.limit}</td>
                        <td className="py-3 px-4 font-mono text-xs">{row.config}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </DocSection>

            {/* ─── Execute Tool API ───────────────────────────────────── */}

            <DocSection id="execute-tool-api" title="Execute Tool API">
              <p className="text-foreground-secondary mb-4">
                The core endpoint for running tools within a session.
              </p>
              <CodeBlock code={executeToolCurl} language="bash" />
              <p className="text-sm text-foreground-secondary mt-3 mb-2">Response:</p>
              <CodeBlock code={executeToolResponse} language="json" />

              <DocSubSection title="Request Fields">
                <ParamTable
                  params={[
                    {
                      name: 'packageName',
                      type: 'string',
                      required: true,
                      description: 'npm package name (e.g. @tpmjs/official-sandbox-shell)',
                    },
                    {
                      name: 'name',
                      type: 'string',
                      required: true,
                      description: 'Named export from the package (e.g. shellExec)',
                    },
                    {
                      name: 'version',
                      type: 'string',
                      required: false,
                      description: 'Package version (default: latest)',
                    },
                    {
                      name: 'params',
                      type: 'object',
                      required: false,
                      description: 'Parameters passed to tool.execute()',
                    },
                    {
                      name: 'sessionId',
                      type: 'string',
                      required: false,
                      description: 'Session ID for workspace resolution',
                    },
                    {
                      name: 'env',
                      type: 'object',
                      required: false,
                      description: 'Environment variables set for this execution only',
                    },
                  ]}
                />
              </DocSubSection>
            </DocSection>

            {/* ─── Health & Metrics ────────────────────────────────────── */}

            <DocSection id="health-metrics" title="Health & Metrics">
              <DocSubSection title="GET /health">
                <p className="text-foreground-secondary mb-2">
                  No authentication required. Use for uptime monitoring and capability detection.
                </p>
                <CodeBlock code={healthResponse} language="json" />
              </DocSubSection>

              <DocSubSection title="GET /metrics">
                <p className="text-foreground-secondary mb-2">
                  No authentication required. Operational metrics for dashboards and alerting.
                </p>
                <CodeBlock code={metricsResponse} language="json" />
              </DocSubSection>
            </DocSection>

            {/* ─── Footer Navigation ─────────────────────────────────── */}

            <div className="flex justify-between pt-8 border-t border-border">
              <Link
                href="/docs/executors/railway"
                className="text-primary hover:underline flex items-center gap-1 text-sm"
              >
                &larr; Railway Executor
              </Link>
              <Link
                href="/docs/executors"
                className="text-primary hover:underline flex items-center gap-1 text-sm"
              >
                All Executors &rarr;
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
