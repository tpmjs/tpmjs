import { CodeBlock } from '@tpmjs/ui/CodeBlock/CodeBlock';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import type { Metadata } from 'next';
import Link from 'next/link';

import { AppFooter } from '~/components/AppFooter';
import { AppHeader } from '~/components/AppHeader';

export const metadata: Metadata = {
  title: 'Custom Executors - TPMJS',
  description:
    'Deploy your own executor to run TPMJS tools on your own infrastructure with full control and privacy.',
};

const executeToolExample = `// POST /execute-tool
{
  "packageName": "@tpmjs/hello",
  "name": "helloWorld",
  "version": "latest",
  "params": { "name": "World" },
  "env": { "MY_API_KEY": "..." }
}`;

const executeToolResponse = `// Response
{
  "success": true,
  "output": "Hello, World!",
  "executionTimeMs": 123
}`;

const healthExample = `// GET /health
{
  "status": "ok",
  "version": "1.0.0"
}`;

export default function ExecutorsDocsPage(): React.ReactElement {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader />

      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-4 py-12">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-3xl font-bold text-foreground mb-4">Custom Executors</h1>
            <p className="text-lg text-foreground-secondary">
              Deploy your own executor to run TPMJS tools on your infrastructure with full control
              over environment, secrets, and data.
            </p>
          </div>

          {/* What is an Executor */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-foreground mb-4">What is an Executor?</h2>
            <p className="text-foreground-secondary mb-4">
              An executor is a service that runs TPMJS tools. When you use a collection or agent,
              TPMJS sends tool execution requests to an executor, which dynamically loads the npm
              package and calls the tool&apos;s{' '}
              <code className="px-1 bg-surface rounded">execute()</code> function.
            </p>
            <p className="text-foreground-secondary">
              By default, TPMJS uses a shared executor. Deploying your own gives you complete
              control over the execution environment.
            </p>
          </section>

          {/* Benefits Grid */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              Why Deploy Your Own Executor?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-surface border border-border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Icon icon="key" className="w-5 h-5 text-primary" />
                  <h3 className="font-medium text-foreground">Privacy</h3>
                </div>
                <p className="text-sm text-foreground-secondary">
                  Keep tool execution data on your own servers. No data passes through TPMJS.
                </p>
              </div>
              <div className="p-4 bg-surface border border-border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Icon icon="edit" className="w-5 h-5 text-primary" />
                  <h3 className="font-medium text-foreground">Custom Environment</h3>
                </div>
                <p className="text-sm text-foreground-secondary">
                  Inject your own API keys, database connections, and secrets into tool execution.
                </p>
              </div>
              <div className="p-4 bg-surface border border-border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Icon icon="folder" className="w-5 h-5 text-primary" />
                  <h3 className="font-medium text-foreground">Full Control</h3>
                </div>
                <p className="text-sm text-foreground-secondary">
                  Choose your infrastructure, scale resources, and customize the execution
                  environment.
                </p>
              </div>
              <div className="p-4 bg-surface border border-border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Icon icon="clock" className="w-5 h-5 text-primary" />
                  <h3 className="font-medium text-foreground">No Timeouts</h3>
                </div>
                <p className="text-sm text-foreground-secondary">
                  Run long-running tools without hitting shared executor time limits.
                </p>
              </div>
            </div>
          </section>

          {/* Choose Your Platform */}
          <section id="deploy" className="mb-12">
            <h2 className="text-2xl font-semibold text-foreground mb-4">Choose Your Platform</h2>
            <p className="text-foreground-secondary mb-6">
              We provide deployment templates for multiple platforms. Choose the one that fits your
              needs:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Railway Card */}
              <Link
                href="/docs/executors/railway"
                className="group p-6 bg-surface border border-border rounded-lg hover:border-primary/50 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-[#0B0D0E] rounded-lg flex items-center justify-center">
                    <svg
                      className="w-7 h-7"
                      viewBox="0 0 24 24"
                      fill="none"
                      role="img"
                      aria-labelledby="railway-logo-title"
                    >
                      <title id="railway-logo-title">Railway logo</title>
                      <path
                        d="M.113 12.611c-.139.312-.107.633.092.917.156.222.38.35.651.357h5.523a.28.28 0 00.216-.1c.07-.078.135-.22.2-.426.224-.718.428-1.09.65-1.492l.003-.005c.247-.448.51-.924.817-1.762.26-.712.296-1.371.113-2.008-.178-.62-.627-1.213-1.406-1.823a.248.248 0 00-.23-.044c-.078.025-.14.08-.178.157l-5.46 4.67a1.017 1.017 0 00-.287.41z"
                        fill="#fff"
                      />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                      Railway
                    </h3>
                    <p className="text-sm text-foreground-secondary mt-1">
                      Always-on with auto-scaling and a $5/month free tier. One-click deploy.
                    </p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <span className="px-2 py-0.5 text-xs bg-success/10 text-success rounded">
                        Official
                      </span>
                      <span className="px-2 py-0.5 text-xs bg-surface-secondary rounded text-foreground-tertiary">
                        Free tier
                      </span>
                      <span className="px-2 py-0.5 text-xs bg-surface-secondary rounded text-foreground-tertiary">
                        Auto-scaling
                      </span>
                    </div>
                  </div>
                  <Icon
                    icon="chevronRight"
                    className="w-5 h-5 text-foreground-tertiary group-hover:text-primary transition-colors"
                  />
                </div>
              </Link>

              {/* Unsandbox Card */}
              <Link
                href="/docs/executors/unsandbox"
                className="group p-6 bg-surface border border-border rounded-lg hover:border-primary/50 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                    un
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                      Unsandbox
                    </h3>
                    <p className="text-sm text-foreground-secondary mt-1">
                      Always-on container execution with automatic HTTPS. Deploy with one CLI
                      command.
                    </p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <span className="px-2 py-0.5 text-xs bg-surface-secondary rounded text-foreground-tertiary">
                        No cold starts
                      </span>
                      <span className="px-2 py-0.5 text-xs bg-surface-secondary rounded text-foreground-tertiary">
                        Unlimited runtime
                      </span>
                    </div>
                  </div>
                  <Icon
                    icon="chevronRight"
                    className="w-5 h-5 text-foreground-tertiary group-hover:text-primary transition-colors"
                  />
                </div>
              </Link>

              {/* Agent Sandbox Card */}
              <Link
                href="/docs/executors/sandbox"
                className="group p-6 bg-surface border border-border rounded-lg hover:border-primary/50 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Icon icon="folder" className="w-7 h-7 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                      Agent Sandbox
                    </h3>
                    <p className="text-sm text-foreground-secondary mt-1">
                      Stateful sessions with persistent filesystem across tool calls within a
                      conversation.
                    </p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <span className="px-2 py-0.5 text-xs bg-primary/10 text-primary rounded">
                        Stateful
                      </span>
                      <span className="px-2 py-0.5 text-xs bg-surface-secondary rounded text-foreground-tertiary">
                        Session-scoped
                      </span>
                    </div>
                  </div>
                  <Icon
                    icon="chevronRight"
                    className="w-5 h-5 text-foreground-tertiary group-hover:text-primary transition-colors"
                  />
                </div>
              </Link>
            </div>

            <p className="text-sm text-foreground-tertiary mt-4">
              You can also build your own executor on any platform that runs Node.js. Just implement
              the API specification below.
            </p>
          </section>

          {/* Comparison Table */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-foreground mb-4">Platform Comparison</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 pr-4 font-medium text-foreground">Feature</th>
                    <th className="text-left py-3 px-4 font-medium text-foreground">Railway</th>
                    <th className="text-left py-3 pl-4 font-medium text-foreground">Unsandbox</th>
                  </tr>
                </thead>
                <tbody className="text-foreground-secondary">
                  <tr className="border-b border-border/50">
                    <td className="py-3 pr-4">Deploy method</td>
                    <td className="py-3 px-4">One-click / CLI</td>
                    <td className="py-3 pl-4">CLI command</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-3 pr-4">Isolation</td>
                    <td className="py-3 px-4">Container-level</td>
                    <td className="py-3 pl-4">Container-level</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-3 pr-4">Cold starts</td>
                    <td className="py-3 px-4">
                      <span className="text-success">None (always-on)</span>
                    </td>
                    <td className="py-3 pl-4">
                      <span className="text-success">None (always-on)</span>
                    </td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-3 pr-4">Max runtime</td>
                    <td className="py-3 px-4">
                      <span className="text-success">Unlimited</span>
                    </td>
                    <td className="py-3 pl-4">
                      <span className="text-success">Unlimited</span>
                    </td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-3 pr-4">Free tier</td>
                    <td className="py-3 px-4">
                      <span className="text-success">$5/month credit</span>
                    </td>
                    <td className="py-3 pl-4">None</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-3 pr-4">Pricing</td>
                    <td className="py-3 px-4">Per usage</td>
                    <td className="py-3 pl-4">Per uptime</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-3 pr-4">Auto-scaling</td>
                    <td className="py-3 px-4">
                      <span className="text-success">Yes</span>
                    </td>
                    <td className="py-3 pl-4">Manual</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-3 pr-4">Custom domains</td>
                    <td className="py-3 px-4">Yes</td>
                    <td className="py-3 pl-4">Yes</td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-4">Docker support</td>
                    <td className="py-3 px-4">Yes</td>
                    <td className="py-3 pl-4">Yes</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-4 p-4 bg-primary/5 border border-primary/20 rounded-lg">
              <p className="text-sm text-foreground-secondary">
                <strong className="text-foreground">Need stateful execution?</strong> The{' '}
                <Link href="/docs/executors/sandbox" className="text-primary hover:underline">
                  Agent Sandbox
                </Link>{' '}
                provides persistent filesystem across tool calls within a conversation. It can be
                deployed on any of the platforms above or used with the TPMJS default sandbox.
              </p>
            </div>
          </section>

          {/* Configuration Section */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              Connecting to Your Executor
            </h2>
            <p className="text-foreground-secondary mb-4">
              Once deployed, configure your collections or agents to use your executor:
            </p>
            <ol className="list-decimal list-inside text-foreground-secondary space-y-3 mb-6">
              <li>Go to your collection or agent settings</li>
              <li>In &quot;Executor Configuration&quot;, select &quot;Custom Executor&quot;</li>
              <li>
                Enter your executor URL (e.g.,{' '}
                <code className="px-1.5 py-0.5 bg-surface rounded">
                  https://my-executor.on.unsandbox.com
                </code>
                )
              </li>
              <li>Add your API key if authentication is enabled</li>
              <li>Click &quot;Verify Connection&quot; to test</li>
            </ol>
            <div className="p-4 bg-warning/10 border border-warning/30 rounded-lg">
              <p className="text-sm text-warning">
                <strong>Security:</strong> Always set{' '}
                <code className="px-1 bg-warning/20 rounded">EXECUTOR_API_KEY</code> to require
                authentication. Without it, anyone can execute tools on your executor.
              </p>
            </div>
          </section>

          {/* API Specification */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              Executor API Specification
            </h2>
            <p className="text-foreground-secondary mb-6">
              All executors must implement these endpoints. Use this spec if building a custom
              executor.
            </p>

            {/* POST /execute-tool */}
            <div className="mb-8">
              <h3 className="text-lg font-medium text-foreground mb-2">
                <code className="px-2 py-1 bg-primary/10 text-primary rounded">POST</code>{' '}
                /execute-tool
              </h3>
              <p className="text-foreground-secondary mb-4">
                Execute a TPMJS tool. The executor should install the npm package, find the named
                export, and call its{' '}
                <code className="px-1 bg-surface rounded">execute(params)</code> function.
              </p>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-foreground mb-2">Request Body:</p>
                  <CodeBlock language="json" code={executeToolExample} />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground mb-2">Response:</p>
                  <CodeBlock language="json" code={executeToolResponse} />
                </div>
              </div>
            </div>

            {/* GET /health */}
            <div className="mb-8">
              <h3 className="text-lg font-medium text-foreground mb-2">
                <code className="px-2 py-1 bg-success/10 text-success rounded">GET</code> /health
              </h3>
              <p className="text-foreground-secondary mb-4">
                Health check endpoint. TPMJS uses this to verify the executor is reachable and
                working.
              </p>
              <div>
                <p className="text-sm font-medium text-foreground mb-2">Response:</p>
                <CodeBlock language="json" code={healthExample} />
              </div>
            </div>

            <div className="p-4 bg-surface border border-border rounded-lg">
              <p className="text-sm text-foreground-secondary">
                <strong>Note:</strong> Both{' '}
                <code className="px-1 bg-surface-secondary rounded">/api/health</code> and{' '}
                <code className="px-1 bg-surface-secondary rounded">/health</code> paths should work
                (same for <code className="px-1 bg-surface-secondary rounded">/execute-tool</code>).
                Our templates support both.
              </p>
            </div>
          </section>

          {/* Executor Cascade */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-foreground mb-4">Executor Cascade</h2>
            <p className="text-foreground-secondary mb-4">
              When a tool is executed, TPMJS resolves which executor to use in this order:
            </p>
            <div className="flex items-center gap-2 text-foreground-secondary mb-4 flex-wrap">
              <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                Agent Config
              </span>
              <Icon icon="chevronRight" className="w-4 h-4" />
              <span className="px-3 py-1 bg-surface border border-border rounded-full text-sm">
                Collection Config
              </span>
              <Icon icon="chevronRight" className="w-4 h-4" />
              <span className="px-3 py-1 bg-surface border border-border rounded-full text-sm">
                System Default
              </span>
            </div>
            <ul className="text-foreground-secondary text-sm space-y-2">
              <li>• If an agent has an executor configured, all tools in that agent use it</li>
              <li>
                • If the agent has no executor but a collection does, tools from that collection use
                the collection&apos;s executor
              </li>
              <li>• If neither has an executor configured, the TPMJS default executor is used</li>
            </ul>
          </section>

          {/* FAQ */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-foreground mb-4">FAQ</h2>
            <div className="space-y-6">
              <div>
                <h3 className="font-medium text-foreground mb-2">
                  Which platform should I choose?
                </h3>
                <p className="text-foreground-secondary text-sm">
                  <strong>Railway</strong> is our official recommendation. It offers one-click
                  deployment, no cold starts, auto-scaling, and a generous $5/month free tier. Use{' '}
                  <strong>Unsandbox</strong> if you prefer a direct CLI deployment onto
                  infrastructure you control.
                </p>
              </div>
              <div>
                <h3 className="font-medium text-foreground mb-2">Can I use other platforms?</h3>
                <p className="text-foreground-secondary text-sm">
                  Yes! Any platform that runs Node.js and exposes HTTP endpoints works. AWS Lambda,
                  Google Cloud Run, Render, Fly.io—just implement the API specification above.
                </p>
              </div>
              <div>
                <h3 className="font-medium text-foreground mb-2">How do tools get loaded?</h3>
                <p className="text-foreground-secondary text-sm">
                  The executor runs <code className="px-1 bg-surface rounded">npm install</code> for
                  the requested package, then dynamically imports it and calls the tool&apos;s{' '}
                  <code className="px-1 bg-surface rounded">execute()</code> function. Each
                  execution uses a fresh temporary directory.
                </p>
              </div>
              <div>
                <h3 className="font-medium text-foreground mb-2">
                  Are environment variables secure?
                </h3>
                <p className="text-foreground-secondary text-sm">
                  Yes. Environment variables are stored encrypted by the execution platform and only
                  available during execution. You can also pass per-request environment variables in
                  the <code className="px-1 bg-surface rounded">env</code> field of the execute-tool
                  request.
                </p>
              </div>
            </div>
          </section>

          {/* Support */}
          <section className="p-6 bg-surface border border-border rounded-lg">
            <h2 className="text-lg font-semibold text-foreground mb-2">Need Help?</h2>
            <p className="text-foreground-secondary text-sm mb-4">
              If you run into issues deploying or configuring your executor, we&apos;re here to
              help.
            </p>
            <div className="flex gap-3">
              <a
                href="https://github.com/tpmjs/tpmjs/issues"
                target="_blank"
                rel="noopener noreferrer"
              >
                <button
                  type="button"
                  className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md bg-surface-secondary hover:bg-surface-tertiary text-foreground transition-colors"
                >
                  <Icon icon="github" className="w-4 h-4 mr-2" />
                  Open an Issue
                </button>
              </a>
              <a href="https://discord.gg/tpmjs" target="_blank" rel="noopener noreferrer">
                <button
                  type="button"
                  className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md hover:bg-surface text-foreground-secondary transition-colors"
                >
                  <Icon icon="discord" className="w-4 h-4 mr-2" />
                  Join Discord
                </button>
              </a>
            </div>
          </section>
        </div>
      </main>

      <AppFooter />
    </div>
  );
}
