import { CodeBlock } from '@tpmjs/ui/CodeBlock/CodeBlock';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import type { Metadata } from 'next';
import Link from 'next/link';

import { AppFooter } from '~/components/AppFooter';
import { AppHeader } from '~/components/AppHeader';

export const metadata: Metadata = {
  title: 'Agent Sandbox - Custom Executors - TPMJS',
  description:
    'Stateful execution sessions for TPMJS agents. Files persist across tool calls within a conversation.',
};

const createSession = `curl -X POST https://your-sandbox.up.railway.app/sessions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer your-api-key" \\
  -d '{"sessionId": "agent123:conv456", "timeoutSeconds": 3600}'`;

const createSessionResponse = `{
  "sessionId": "agent123:conv456",
  "workDir": "/tmp/tpmjs-sandbox/sessions/agent123_conv456/workspace",
  "createdAt": "2025-01-01T00:00:00.000Z",
  "expiresAt": "2025-01-01T01:00:00.000Z",
  "resumed": false
}`;

const executeTool = `curl -X POST https://your-sandbox.up.railway.app/execute-tool \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer your-api-key" \\
  -d '{
    "packageName": "@tpmjs/hello",
    "name": "helloWorldTool",
    "version": "0.0.2",
    "params": {"includeTimestamp": true},
    "sessionId": "agent123:conv456"
  }'`;

const destroySession = `curl -X DELETE https://your-sandbox.up.railway.app/sessions/agent123:conv456 \\
  -H "Authorization: Bearer your-api-key"`;

const healthResponse = `{
  "status": "ok",
  "version": "1.0.0",
  "info": {
    "runtime": "deno",
    "activeSessions": 3,
    "maxSessions": 50,
    "capabilities": { "sessions": true }
  }
}`;

const dockerDeploy = `# Clone the template
git clone https://github.com/tpmjs/tpmjs.git
cd tpmjs/templates/agent-sandbox

# Build and run
docker build -t tpmjs-sandbox .
docker run -p 3002:3002 -e EXECUTOR_API_KEY=your-key tpmjs-sandbox`;

const railwayDeploy = `# Clone the template
git clone https://github.com/tpmjs/tpmjs.git
cd tpmjs/templates/agent-sandbox

# Install Railway CLI & deploy
npm install -g @railway/cli
railway login
railway init
railway up`;

export default function SandboxExecutorPage(): React.ReactElement {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader />

      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-4 py-12">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-foreground-secondary mb-8">
            <Link href="/docs/executors" className="hover:text-foreground transition-colors">
              Executors
            </Link>
            <Icon icon="chevronRight" className="w-4 h-4" />
            <span className="text-foreground">Agent Sandbox</span>
          </nav>

          {/* Header */}
          <div className="mb-12">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Icon icon="folder" className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Agent Sandbox</h1>
                <p className="text-foreground-secondary mt-1">
                  Stateful execution with persistent filesystem
                </p>
              </div>
            </div>
          </div>

          {/* What is it */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-4">What is the Agent Sandbox?</h2>
            <p className="text-foreground-secondary mb-4">
              The Agent Sandbox is an executor that provides{' '}
              <strong className="text-foreground">stateful execution sessions</strong>. Unlike the
              default executor where each tool call is independent, the sandbox gives each
              conversation its own persistent filesystem. Files created by one tool call are
              available to all subsequent tool calls in the same conversation.
            </p>
            <p className="text-foreground-secondary">
              This enables multi-step workflows like: generate a CSV, then analyze it, then create a
              chart from the analysis — all within a single conversation.
            </p>
          </section>

          {/* When to use */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-4">When to Use It</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {
                  title: 'Multi-step Workflows',
                  desc: 'Generate files in one step, process them in the next',
                },
                {
                  title: 'Data Pipelines',
                  desc: 'Fetch data, transform it, then export results',
                },
                {
                  title: 'Filesystem Operations',
                  desc: 'Tools that read/write files need shared state',
                },
                {
                  title: 'Code Generation',
                  desc: 'Generate code in one step, test or build it in another',
                },
              ].map((item) => (
                <div key={item.title} className="p-4 bg-surface border border-border rounded-lg">
                  <h3 className="font-medium text-foreground mb-1">{item.title}</h3>
                  <p className="text-sm text-foreground-secondary">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Session Lifecycle */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-4">Session Lifecycle</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-sm font-bold text-primary">1</span>
                </div>
                <div>
                  <h3 className="font-medium text-foreground">Session Created</h3>
                  <p className="text-sm text-foreground-secondary">
                    When you send the first message to a sandbox-enabled agent, a session is
                    automatically created with a unique workspace directory. The session ID is{' '}
                    <code className="text-xs bg-surface px-1 py-0.5 rounded">
                      agentId:conversationId
                    </code>
                    .
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-sm font-bold text-primary">2</span>
                </div>
                <div>
                  <h3 className="font-medium text-foreground">TTL Extended on Activity</h3>
                  <p className="text-sm text-foreground-secondary">
                    Each message and tool call extends the session TTL. The default TTL is 1 hour.
                    Session creation is idempotent — sending another message just extends the
                    timeout.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-sm font-bold text-primary">3</span>
                </div>
                <div>
                  <h3 className="font-medium text-foreground">Auto-Expire or Manual Cleanup</h3>
                  <p className="text-sm text-foreground-secondary">
                    Sessions expire after the TTL (default 1 hour of inactivity). The workspace
                    directory is cleaned up automatically. Deleting a conversation also destroys the
                    session immediately.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Default vs Self-hosted */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Default Sandbox vs Self-hosted
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-border rounded-lg">
                <thead>
                  <tr className="bg-surface">
                    <th className="text-left p-3 text-foreground font-medium border-b border-border" />
                    <th className="text-left p-3 text-foreground font-medium border-b border-border">
                      TPMJS Default Sandbox
                    </th>
                    <th className="text-left p-3 text-foreground font-medium border-b border-border">
                      Self-hosted
                    </th>
                  </tr>
                </thead>
                <tbody className="text-foreground-secondary">
                  <tr>
                    <td className="p-3 border-b border-border font-medium text-foreground">
                      Setup
                    </td>
                    <td className="p-3 border-b border-border">
                      Zero config — just select &quot;Agent Sandbox&quot;
                    </td>
                    <td className="p-3 border-b border-border">
                      Deploy template to Railway/Docker
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3 border-b border-border font-medium text-foreground">
                      URL Config
                    </td>
                    <td className="p-3 border-b border-border">Leave URL field empty</td>
                    <td className="p-3 border-b border-border">Enter your sandbox URL</td>
                  </tr>
                  <tr>
                    <td className="p-3 border-b border-border font-medium text-foreground">
                      Data Privacy
                    </td>
                    <td className="p-3 border-b border-border">Shared infrastructure</td>
                    <td className="p-3 border-b border-border">Your infrastructure, your data</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium text-foreground">Customization</td>
                    <td className="p-3">Standard limits</td>
                    <td className="p-3">Custom TTL, disk quotas, session limits</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* API Contract */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-4">API Reference</h2>

            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  POST /sessions — Create or Resume Session
                </h3>
                <CodeBlock code={createSession} language="bash" />
                <p className="text-sm text-foreground-secondary mt-2 mb-2">Response:</p>
                <CodeBlock code={createSessionResponse} language="json" />
              </div>

              <div>
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  POST /execute-tool — Execute with Session
                </h3>
                <p className="text-sm text-foreground-secondary mb-2">
                  Same as the standard executor but with an additional{' '}
                  <code className="text-xs bg-surface px-1 py-0.5 rounded">sessionId</code> field.
                  The tool runs in the session&apos;s workspace directory.
                </p>
                <CodeBlock code={executeTool} language="bash" />
              </div>

              <div>
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  DELETE /sessions/:id — Destroy Session
                </h3>
                <CodeBlock code={destroySession} language="bash" />
              </div>

              <div>
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  GET /health — Health Check
                </h3>
                <p className="text-sm text-foreground-secondary mb-2">
                  Includes session capability info:
                </p>
                <CodeBlock code={healthResponse} language="json" />
              </div>
            </div>
          </section>

          {/* Deploy Your Own */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-4">Deploy Your Own</h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-3">Railway</h3>
                <CodeBlock code={railwayDeploy} language="bash" />
              </div>

              <div>
                <h3 className="text-lg font-semibold text-foreground mb-3">Docker</h3>
                <CodeBlock code={dockerDeploy} language="bash" />
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-lg font-semibold text-foreground mb-3">Environment Variables</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border border-border rounded-lg">
                  <thead>
                    <tr className="bg-surface">
                      <th className="text-left p-3 text-foreground font-medium border-b border-border">
                        Variable
                      </th>
                      <th className="text-left p-3 text-foreground font-medium border-b border-border">
                        Default
                      </th>
                      <th className="text-left p-3 text-foreground font-medium border-b border-border">
                        Description
                      </th>
                    </tr>
                  </thead>
                  <tbody className="text-foreground-secondary">
                    <tr>
                      <td className="p-3 border-b border-border font-mono text-xs">
                        EXECUTOR_API_KEY
                      </td>
                      <td className="p-3 border-b border-border">-</td>
                      <td className="p-3 border-b border-border">Bearer token for auth</td>
                    </tr>
                    <tr>
                      <td className="p-3 border-b border-border font-mono text-xs">
                        MAX_CONCURRENT_SESSIONS
                      </td>
                      <td className="p-3 border-b border-border">50</td>
                      <td className="p-3 border-b border-border">Max active sessions</td>
                    </tr>
                    <tr>
                      <td className="p-3 border-b border-border font-mono text-xs">
                        DEFAULT_SESSION_TTL_SECONDS
                      </td>
                      <td className="p-3 border-b border-border">3600</td>
                      <td className="p-3 border-b border-border">Session timeout (1 hour)</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono text-xs">PORT</td>
                      <td className="p-3">3002</td>
                      <td className="p-3">Server port</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* Navigation */}
          <div className="flex justify-between pt-8 border-t border-border">
            <Link
              href="/docs/executors/railway"
              className="text-primary hover:underline flex items-center gap-1"
            >
              <Icon icon="chevronLeft" className="w-4 h-4" />
              Railway Executor
            </Link>
            <Link
              href="/docs/executors"
              className="text-primary hover:underline flex items-center gap-1"
            >
              All Executors
              <Icon icon="chevronRight" className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </main>

      <AppFooter />
    </div>
  );
}
