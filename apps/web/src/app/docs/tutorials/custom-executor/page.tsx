import { Button } from '@tpmjs/ui/Button/Button';
import { CodeBlock } from '@tpmjs/ui/CodeBlock/CodeBlock';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import type { Metadata } from 'next';
import Link from 'next/link';

import { AppFooter } from '~/components/AppFooter';
import { AppHeader } from '~/components/AppHeader';

export const metadata: Metadata = {
  title: 'Deploy Your Own Executor - Tutorial - TPMJS',
  description:
    'Step-by-step guide to deploy and configure your own custom executor for TPMJS tools in under 10 minutes.',
};

const envVarsExample = `# Optional: Require authentication for all requests
EXECUTOR_API_KEY=your-secret-api-key

# Optional: Custom environment variables for your tools
MY_API_KEY=sk-xxx
DATABASE_URL=postgresql://...`;

const verifyCommand = 'curl -X GET https://your-executor.vercel.app/health';

const verifyResponse = `{
  "status": "ok",
  "version": "1.0.0"
}`;

const testExecutionCommand = `curl -X POST https://your-executor.vercel.app/execute-tool \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer your-secret-api-key" \\
  -d '{
    "packageName": "@anthropic-ai/tpmjs-hello",
    "name": "helloWorld",
    "params": { "name": "World" }
  }'`;

const testExecutionResponse = `{
  "success": true,
  "output": "Hello, World!",
  "executionTimeMs": 145
}`;

export default function CustomExecutorTutorialPage(): React.ReactElement {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader />

      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-4 py-12">
          {/* Header */}
          <div className="mb-12">
            <div className="flex items-center gap-2 text-sm text-foreground-secondary mb-4">
              <Link href="/docs" className="hover:text-primary">
                Docs
              </Link>
              <Icon icon="chevronRight" className="w-4 h-4" />
              <Link href="/docs/tutorials" className="hover:text-primary">
                Tutorials
              </Link>
              <Icon icon="chevronRight" className="w-4 h-4" />
              <span>Custom Executor</span>
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-4">
              Deploy Your Own Executor in 10 Minutes
            </h1>
            <p className="text-lg text-foreground-secondary">
              This tutorial walks you through deploying a custom executor to Vercel and connecting
              it to your TPMJS collections. No coding required.
            </p>
          </div>

          {/* Prerequisites */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-foreground mb-4">Prerequisites</h2>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-4 bg-surface border border-border rounded-lg">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Icon icon="check" className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Vercel Account</p>
                  <p className="text-sm text-foreground-secondary">
                    Free tier works great.{' '}
                    <a
                      href="https://vercel.com/signup"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      Sign up here
                    </a>{' '}
                    if you don&apos;t have one.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-surface border border-border rounded-lg">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Icon icon="check" className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">TPMJS Account</p>
                  <p className="text-sm text-foreground-secondary">
                    You&apos;ll need a collection or agent to connect your executor to.{' '}
                    <Link href="/sign-up" className="text-primary hover:underline">
                      Create an account
                    </Link>{' '}
                    if needed.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Step 1 */}
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold">
                1
              </div>
              <h2 className="text-2xl font-semibold text-foreground">
                Deploy the Executor Template
              </h2>
            </div>

            <p className="text-foreground-secondary mb-6">
              Click the button below to deploy the TPMJS executor template to your Vercel account.
              This creates a private copy you fully control.
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

            <div className="p-4 bg-surface border border-border rounded-lg">
              <h3 className="font-medium text-foreground mb-3">What happens when you click:</h3>
              <ol className="list-decimal list-inside text-sm text-foreground-secondary space-y-2">
                <li>Vercel clones the executor template to your GitHub account</li>
                <li>A new Vercel project is created and linked to the repository</li>
                <li>
                  The executor is automatically deployed to a URL like{' '}
                  <code className="px-1.5 py-0.5 bg-surface-secondary rounded">
                    tpmjs-executor-xxx.vercel.app
                  </code>
                </li>
                <li>Future pushes to your repo trigger automatic redeployments</li>
              </ol>
            </div>
          </section>

          {/* Step 2 */}
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold">
                2
              </div>
              <h2 className="text-2xl font-semibold text-foreground">
                Configure Environment Variables (Optional)
              </h2>
            </div>

            <p className="text-foreground-secondary mb-6">
              After deployment, you can add environment variables for security and customization. Go
              to your Vercel project → Settings → Environment Variables.
            </p>

            <CodeBlock language="bash" code={envVarsExample} />

            <div className="mt-4 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
              <div className="flex items-start gap-2">
                <Icon icon="alertCircle" className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-600 dark:text-amber-400">
                    Security Recommendation
                  </p>
                  <p className="text-sm text-foreground-secondary mt-1">
                    Set <code className="px-1 bg-amber-500/20 rounded">EXECUTOR_API_KEY</code> to
                    require authentication. Without it, anyone with your executor URL can execute
                    tools.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Step 3 */}
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold">
                3
              </div>
              <h2 className="text-2xl font-semibold text-foreground">
                Verify Your Executor is Running
              </h2>
            </div>

            <p className="text-foreground-secondary mb-6">
              Once deployed, test that your executor is healthy by calling the health endpoint.
              Replace the URL with your actual deployment URL.
            </p>

            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-foreground mb-2">Run this command:</p>
                <CodeBlock language="bash" code={verifyCommand} />
              </div>

              <div>
                <p className="text-sm font-medium text-foreground mb-2">Expected response:</p>
                <CodeBlock language="json" code={verifyResponse} />
              </div>
            </div>

            <div className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
              <div className="flex items-start gap-2">
                <Icon icon="check" className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-foreground-secondary">
                  If you see{' '}
                  <code className="px-1 bg-green-500/20 rounded">
                    &quot;status&quot;: &quot;ok&quot;
                  </code>
                  , your executor is running and ready to use!
                </p>
              </div>
            </div>
          </section>

          {/* Step 4 */}
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold">
                4
              </div>
              <h2 className="text-2xl font-semibold text-foreground">
                Test Tool Execution (Optional)
              </h2>
            </div>

            <p className="text-foreground-secondary mb-6">
              Before connecting to TPMJS, you can verify tool execution works directly. This calls
              the hello world tool on your executor.
            </p>

            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-foreground mb-2">Test execution:</p>
                <CodeBlock language="bash" code={testExecutionCommand} />
              </div>

              <div>
                <p className="text-sm font-medium text-foreground mb-2">Expected response:</p>
                <CodeBlock language="json" code={testExecutionResponse} />
              </div>
            </div>
          </section>

          {/* Step 5 */}
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold">
                5
              </div>
              <h2 className="text-2xl font-semibold text-foreground">Connect to Your Collection</h2>
            </div>

            <p className="text-foreground-secondary mb-6">
              Now connect your executor to a TPMJS collection so all tools in that collection run on
              your infrastructure.
            </p>

            <ol className="space-y-4">
              <li className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-surface-secondary flex items-center justify-center text-sm font-medium text-foreground flex-shrink-0">
                  a
                </span>
                <div>
                  <p className="text-foreground">
                    Go to your{' '}
                    <Link href="/dashboard/collections" className="text-primary hover:underline">
                      Collections dashboard
                    </Link>
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-surface-secondary flex items-center justify-center text-sm font-medium text-foreground flex-shrink-0">
                  b
                </span>
                <div>
                  <p className="text-foreground">
                    Click on the collection you want to use your executor with
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-surface-secondary flex items-center justify-center text-sm font-medium text-foreground flex-shrink-0">
                  c
                </span>
                <div>
                  <p className="text-foreground">Click the &quot;Edit&quot; button</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-surface-secondary flex items-center justify-center text-sm font-medium text-foreground flex-shrink-0">
                  d
                </span>
                <div>
                  <p className="text-foreground">
                    In the &quot;Executor Configuration&quot; section, select &quot;Custom
                    Executor&quot;
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-surface-secondary flex items-center justify-center text-sm font-medium text-foreground flex-shrink-0">
                  e
                </span>
                <div>
                  <p className="text-foreground">
                    Enter your executor URL (e.g.,{' '}
                    <code className="px-1.5 py-0.5 bg-surface-secondary rounded">
                      https://tpmjs-executor-xxx.vercel.app
                    </code>
                    )
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-surface-secondary flex items-center justify-center text-sm font-medium text-foreground flex-shrink-0">
                  f
                </span>
                <div>
                  <p className="text-foreground">
                    If you set an API key, enter it in the &quot;API Key&quot; field
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-surface-secondary flex items-center justify-center text-sm font-medium text-foreground flex-shrink-0">
                  g
                </span>
                <div>
                  <p className="text-foreground">
                    Click &quot;Verify Connection&quot; to test the configuration
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-surface-secondary flex items-center justify-center text-sm font-medium text-foreground flex-shrink-0">
                  h
                </span>
                <div>
                  <p className="text-foreground">Click &quot;Save Changes&quot;</p>
                </div>
              </li>
            </ol>

            <div className="mt-6 p-4 bg-primary/5 border border-primary/20 rounded-lg">
              <div className="flex items-start gap-2">
                <Icon icon="info" className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-foreground">Pro Tip</p>
                  <p className="text-sm text-foreground-secondary mt-1">
                    You can also configure executors at the Agent level. Agent executor config takes
                    priority over collection config. See{' '}
                    <Link href="/docs/executors#cascade" className="text-primary hover:underline">
                      executor cascade
                    </Link>{' '}
                    for details.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Step 6 */}
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold">
                6
              </div>
              <h2 className="text-2xl font-semibold text-foreground">You&apos;re Done!</h2>
            </div>

            <p className="text-foreground-secondary mb-6">
              All tools in your collection now execute on your custom executor. When you or anyone
              else uses your collection via MCP, the tools run on your Vercel deployment instead of
              the TPMJS default executor.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-surface border border-border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Icon icon="globe" className="w-5 h-5 text-primary" />
                  <h3 className="font-medium text-foreground">Full Privacy</h3>
                </div>
                <p className="text-sm text-foreground-secondary">
                  Tool execution happens entirely on your infrastructure. No data passes through
                  TPMJS servers.
                </p>
              </div>
              <div className="p-4 bg-surface border border-border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Icon icon="edit" className="w-5 h-5 text-primary" />
                  <h3 className="font-medium text-foreground">Custom Environment</h3>
                </div>
                <p className="text-sm text-foreground-secondary">
                  Add your own API keys and secrets as environment variables in Vercel.
                </p>
              </div>
              <div className="p-4 bg-surface border border-border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Icon icon="clock" className="w-5 h-5 text-primary" />
                  <h3 className="font-medium text-foreground">Your Limits</h3>
                </div>
                <p className="text-sm text-foreground-secondary">
                  Execution timeouts and rate limits are controlled by your Vercel plan.
                </p>
              </div>
              <div className="p-4 bg-surface border border-border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Icon icon="folder" className="w-5 h-5 text-primary" />
                  <h3 className="font-medium text-foreground">Full Control</h3>
                </div>
                <p className="text-sm text-foreground-secondary">
                  Fork and modify the executor code to add custom functionality.
                </p>
              </div>
            </div>
          </section>

          {/* Troubleshooting */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-foreground mb-4">Troubleshooting</h2>

            <div className="space-y-4">
              <div className="p-4 bg-surface border border-border rounded-lg">
                <h3 className="font-medium text-foreground mb-2">
                  &quot;Verification failed&quot; when connecting
                </h3>
                <ul className="text-sm text-foreground-secondary space-y-1 list-disc list-inside">
                  <li>Check that your executor URL is correct (no trailing slash)</li>
                  <li>
                    Ensure the executor is deployed and healthy (check{' '}
                    <code className="px-1 bg-surface-secondary rounded">/health</code> endpoint)
                  </li>
                  <li>
                    If using an API key, make sure it matches what&apos;s in Vercel environment
                    variables
                  </li>
                </ul>
              </div>

              <div className="p-4 bg-surface border border-border rounded-lg">
                <h3 className="font-medium text-foreground mb-2">Tools timing out</h3>
                <ul className="text-sm text-foreground-secondary space-y-1 list-disc list-inside">
                  <li>Vercel&apos;s free tier has a 10-second timeout per request</li>
                  <li>Upgrade to Pro for 60-second timeouts, or use a different host</li>
                  <li>Consider caching or optimizing slow tools</li>
                </ul>
              </div>

              <div className="p-4 bg-surface border border-border rounded-lg">
                <h3 className="font-medium text-foreground mb-2">
                  &quot;Unauthorized&quot; errors
                </h3>
                <ul className="text-sm text-foreground-secondary space-y-1 list-disc list-inside">
                  <li>
                    Your executor has{' '}
                    <code className="px-1 bg-surface-secondary rounded">EXECUTOR_API_KEY</code> set
                    but you didn&apos;t provide it in TPMJS
                  </li>
                  <li>Go to your collection/agent settings and add the API key</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Next Steps */}
          <section className="p-6 bg-surface border border-border rounded-lg">
            <h2 className="text-lg font-semibold text-foreground mb-4">Next Steps</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link
                href="/docs/executors"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-secondary transition-colors"
              >
                <Icon icon="link" className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium text-foreground">API Reference</p>
                  <p className="text-sm text-foreground-secondary">
                    Full executor API specification
                  </p>
                </div>
              </Link>
              <Link
                href="/dashboard/collections"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-secondary transition-colors"
              >
                <Icon icon="folder" className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium text-foreground">Your Collections</p>
                  <p className="text-sm text-foreground-secondary">Manage executor settings</p>
                </div>
              </Link>
              <a
                href="https://github.com/tpmjs/tpmjs/tree/main/templates/vercel-executor"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-secondary transition-colors"
              >
                <Icon icon="github" className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium text-foreground">Executor Source</p>
                  <p className="text-sm text-foreground-secondary">View and customize the code</p>
                </div>
              </a>
              <Link
                href="/docs/tutorials/mcp"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-secondary transition-colors"
              >
                <Icon icon="link" className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium text-foreground">MCP Setup</p>
                  <p className="text-sm text-foreground-secondary">Connect to Claude Desktop</p>
                </div>
              </Link>
            </div>
          </section>
        </div>
      </main>

      <AppFooter />
    </div>
  );
}
