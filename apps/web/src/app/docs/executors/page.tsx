import { Button } from '@tpmjs/ui/Button/Button';
import { CodeBlock } from '@tpmjs/ui/CodeBlock/CodeBlock';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import type { Metadata } from 'next';
import Link from 'next/link';

import { AppFooter } from '~/components/AppFooter';
import { AppHeader } from '~/components/AppHeader';

export const metadata: Metadata = {
  title: 'Custom Executors - TPMJS',
  description:
    'Learn how to deploy and configure custom executors for running TPMJS tools on your own infrastructure.',
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
              Deploy your own executor to run TPMJS tools on your own infrastructure.
            </p>
          </div>

          {/* Quick Start Banner */}
          <section className="mb-12">
            <Link
              href="/docs/tutorials/custom-executor"
              className="block p-4 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/30 rounded-lg hover:border-primary/50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="text-3xl">🚀</div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">
                    New to custom executors? Start with the tutorial
                  </p>
                  <p className="text-sm text-foreground-secondary">
                    Deploy your own executor in 10 minutes with our step-by-step guide
                  </p>
                </div>
                <Icon icon="chevronRight" className="w-5 h-5 text-primary" />
              </div>
            </Link>
          </section>

          {/* Overview Section */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-foreground mb-4">What is an Executor?</h2>
            <p className="text-foreground-secondary mb-4">
              An executor is a service that runs TPMJS tools. When you use a collection or agent,
              TPMJS sends tool execution requests to an executor, which dynamically loads and runs
              the tool code.
            </p>
            <p className="text-foreground-secondary mb-6">
              By default, TPMJS uses a shared executor. You can deploy your own for:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-surface border border-border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Icon icon="folder" className="w-5 h-5 text-primary" />
                  <h3 className="font-medium text-foreground">Full Control</h3>
                </div>
                <p className="text-sm text-foreground-secondary">
                  Run tools on your own infrastructure with complete control over the execution
                  environment.
                </p>
              </div>
              <div className="p-4 bg-surface border border-border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Icon icon="globe" className="w-5 h-5 text-primary" />
                  <h3 className="font-medium text-foreground">Privacy</h3>
                </div>
                <p className="text-sm text-foreground-secondary">
                  Keep tool execution data on your own servers. No data leaves your infrastructure.
                </p>
              </div>
              <div className="p-4 bg-surface border border-border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Icon icon="clock" className="w-5 h-5 text-primary" />
                  <h3 className="font-medium text-foreground">Performance</h3>
                </div>
                <p className="text-sm text-foreground-secondary">
                  Deploy in regions closest to your users for lower latency tool execution.
                </p>
              </div>
              <div className="p-4 bg-surface border border-border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Icon icon="edit" className="w-5 h-5 text-primary" />
                  <h3 className="font-medium text-foreground">Custom Environment</h3>
                </div>
                <p className="text-sm text-foreground-secondary">
                  Inject your own environment variables, secrets, and configuration into tool
                  execution.
                </p>
              </div>
            </div>
          </section>

          {/* Deploy Section */}
          <section id="deploy" className="mb-12">
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              Deploy Your Own Executor
            </h2>
            <p className="text-foreground-secondary mb-6">
              The fastest way to get started is to deploy our template to Vercel with one click:
            </p>
            <div className="mb-6">
              <a
                href="https://vercel.com/new/clone?repository-url=https://github.com/tpmjs/tpmjs/tree/main/templates/vercel-executor&project-name=tpmjs-executor&repository-name=tpmjs-executor"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button size="lg">
                  <Icon icon="externalLink" className="w-4 h-4 mr-2" />
                  Deploy to Vercel
                </Button>
              </a>
            </div>
            <p className="text-sm text-foreground-tertiary">
              After deployment, you&apos;ll get a URL like{' '}
              <code className="px-1.5 py-0.5 bg-surface rounded text-foreground-secondary">
                https://tpmjs-executor.vercel.app
              </code>
            </p>
          </section>

          {/* Configuration Section */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-foreground mb-4">Configuration</h2>
            <p className="text-foreground-secondary mb-4">
              Once you have your executor deployed, configure your collections or agents to use it:
            </p>
            <ol className="list-decimal list-inside text-foreground-secondary space-y-3 mb-6">
              <li>Go to your collection or agent settings</li>
              <li>
                In the &quot;Executor Configuration&quot; section, select &quot;Custom
                Executor&quot;
              </li>
              <li>
                Enter your executor URL (e.g.,{' '}
                <code className="px-1.5 py-0.5 bg-surface rounded">
                  https://tpmjs-executor.vercel.app
                </code>
                )
              </li>
              <li>Optionally add an API key if your executor requires authentication</li>
              <li>Click &quot;Verify Connection&quot; to test the configuration</li>
            </ol>
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
              <p className="text-sm text-amber-600 dark:text-amber-400">
                <strong>Security tip:</strong> Set the{' '}
                <code className="px-1 bg-amber-500/20 rounded">EXECUTOR_API_KEY</code> environment
                variable in your Vercel project to require authentication for all requests.
              </p>
            </div>
          </section>

          {/* API Specification */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              Executor API Specification
            </h2>
            <p className="text-foreground-secondary mb-6">All executors must implement this API:</p>

            {/* POST /execute-tool */}
            <div className="mb-8">
              <h3 className="text-lg font-medium text-foreground mb-2">
                <code className="px-2 py-1 bg-primary/10 text-primary rounded">POST</code>{' '}
                /execute-tool
              </h3>
              <p className="text-foreground-secondary mb-4">
                Execute a TPMJS tool with the provided parameters.
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
                <code className="px-2 py-1 bg-green-500/10 text-green-500 rounded">GET</code>{' '}
                /health
              </h3>
              <p className="text-foreground-secondary mb-4">
                Check executor health status. Used by TPMJS to verify the executor is reachable.
              </p>
              <div>
                <p className="text-sm font-medium text-foreground mb-2">Response:</p>
                <CodeBlock language="json" code={healthExample} />
              </div>
            </div>
          </section>

          {/* Cascade Section */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-foreground mb-4">Executor Cascade</h2>
            <p className="text-foreground-secondary mb-4">
              Executor configuration follows a cascade resolution order:
            </p>
            <div className="flex items-center gap-2 text-foreground-secondary mb-4">
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

          {/* FAQ Section */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-foreground mb-4">FAQ</h2>
            <div className="space-y-6">
              <div>
                <h3 className="font-medium text-foreground mb-2">Can I use any cloud provider?</h3>
                <p className="text-foreground-secondary text-sm">
                  Yes! While we provide a Vercel template, you can deploy an executor anywhere that
                  can run Node.js and expose an HTTP endpoint. The executor just needs to implement
                  the API specification above.
                </p>
              </div>
              <div>
                <h3 className="font-medium text-foreground mb-2">What about timeouts?</h3>
                <p className="text-foreground-secondary text-sm">
                  The default timeout for tool execution is 30 seconds. On Vercel&apos;s free tier,
                  you get up to 10 seconds per request. For longer-running tools, consider deploying
                  to a platform with higher timeout limits.
                </p>
              </div>
              <div>
                <h3 className="font-medium text-foreground mb-2">How do tools get loaded?</h3>
                <p className="text-foreground-secondary text-sm">
                  Tools are dynamically imported from{' '}
                  <Link href="https://esm.sh" className="text-primary hover:underline">
                    esm.sh
                  </Link>
                  , a CDN for npm packages. The executor fetches the package, finds the tool export,
                  and calls its <code className="px-1 bg-surface rounded">execute()</code> function.
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
                <Button variant="secondary" size="sm">
                  <Icon icon="github" className="w-4 h-4 mr-2" />
                  Open an Issue
                </Button>
              </a>
              <a href="https://discord.gg/tpmjs" target="_blank" rel="noopener noreferrer">
                <Button variant="ghost" size="sm">
                  <Icon icon="discord" className="w-4 h-4 mr-2" />
                  Join Discord
                </Button>
              </a>
            </div>
          </section>
        </div>
      </main>

      <AppFooter />
    </div>
  );
}
