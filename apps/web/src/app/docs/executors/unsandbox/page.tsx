import { CodeBlock } from '@tpmjs/ui/CodeBlock/CodeBlock';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import type { Metadata } from 'next';
import Link from 'next/link';

import { AppFooter } from '~/components/AppFooter';
import { AppHeader } from '~/components/AppHeader';

export const metadata: Metadata = {
  title: 'Deploy to Unsandbox - Custom Executors - TPMJS',
  description:
    'Deploy a TPMJS executor to Unsandbox with one CLI command. Always-on, no cold starts, unlimited runtime.',
};

const deployCommand = `# Install the Unsandbox CLI
curl -fsSL https://unsandbox.com/install.sh | bash

# Deploy the TPMJS executor
un service --name tpmjs-executor --ports 80 -n semitrusted \\
  --bootstrap "curl -fsSL https://raw.githubusercontent.com/tpmjs/tpmjs/main/templates/unsandbox-executor/bootstrap.sh | bash"`;

const deployWithApiKey = `un service --name tpmjs-executor --ports 80 -n semitrusted \\
  -e EXECUTOR_API_KEY=your-secure-random-key \\
  --bootstrap "curl -fsSL https://raw.githubusercontent.com/tpmjs/tpmjs/main/templates/unsandbox-executor/bootstrap.sh | bash"`;

const deployWithEnvVars = `un service --name tpmjs-executor --ports 80 -n semitrusted \\
  -e EXECUTOR_API_KEY=your-key \\
  -e OPENAI_API_KEY=sk-xxx \\
  -e DATABASE_URL=postgres://... \\
  --bootstrap "curl -fsSL https://raw.githubusercontent.com/tpmjs/tpmjs/main/templates/unsandbox-executor/bootstrap.sh | bash"`;

const deployWithEnvFile = `# Create .env file with your secrets
cat > .env << EOF
EXECUTOR_API_KEY=your-key
OPENAI_API_KEY=sk-xxx
DATABASE_URL=postgres://...
EOF

# Deploy with env file
un service --name tpmjs-executor --ports 80 -n semitrusted \\
  --env-file .env \\
  --bootstrap "curl -fsSL https://raw.githubusercontent.com/tpmjs/tpmjs/main/templates/unsandbox-executor/bootstrap.sh | bash"`;

const healthCheck = `curl https://tpmjs-executor.on.unsandbox.com/api/health`;

const healthResponse = `{
  "status": "ok",
  "version": "1.0.0",
  "info": {
    "runtime": "unsandbox",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}`;

const executeExample = `curl -X POST https://tpmjs-executor.on.unsandbox.com/api/execute-tool \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer your-api-key" \\
  -d '{
    "packageName": "@tpmjs/hello",
    "name": "helloWorldTool",
    "version": "latest",
    "params": { "includeTimestamp": true }
  }'`;

const localDev = `# Clone the repository
git clone https://github.com/tpmjs/tpmjs.git
cd tpmjs/templates/unsandbox-executor

# Run locally
PORT=3000 node executor.js

# Test health endpoint
curl http://localhost:3000/api/health`;

const managementCommands = `# View logs
un service --logs tpmjs-executor

# Redeploy (after updating)
un service --redeploy tpmjs-executor

# Freeze when not in use (save costs)
un service --freeze tpmjs-executor

# Unfreeze when needed
un service --unfreeze tpmjs-executor

# Scale resources (4 vCPU, 8GB RAM)
un service --resize tpmjs-executor --vcpu 4

# Destroy service
un service --destroy tpmjs-executor`;

const customDomain = `un service --name tpmjs-executor --ports 80 -n semitrusted \\
  --domains executor.yourdomain.com \\
  --bootstrap "curl -fsSL https://raw.githubusercontent.com/tpmjs/tpmjs/main/templates/unsandbox-executor/bootstrap.sh | bash"`;

export default function UnsandboxExecutorPage(): React.ReactElement {
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
            <span className="text-foreground">Unsandbox</span>
          </nav>

          {/* Header */}
          <div className="mb-12">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                un
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Deploy to Unsandbox</h1>
                <p className="text-foreground-secondary">
                  Always-on execution with one CLI command
                </p>
              </div>
            </div>
          </div>

          {/* Why Unsandbox */}
          <section className="mb-12">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-surface border border-border rounded-lg">
                <div className="text-2xl mb-2">0ms</div>
                <div className="text-sm text-foreground-secondary">No cold starts</div>
              </div>
              <div className="p-4 bg-surface border border-border rounded-lg">
                <div className="text-2xl mb-2">&infin;</div>
                <div className="text-sm text-foreground-secondary">Unlimited runtime</div>
              </div>
              <div className="p-4 bg-surface border border-border rounded-lg">
                <div className="text-2xl mb-2">1 cmd</div>
                <div className="text-sm text-foreground-secondary">Deploy in seconds</div>
              </div>
            </div>
          </section>

          {/* Quick Deploy */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-foreground mb-4">Quick Deploy</h2>
            <p className="text-foreground-secondary mb-4">
              Deploy a TPMJS executor with a single command. Your executor will be live at{' '}
              <code className="px-1.5 py-0.5 bg-surface rounded">
                https://tpmjs-executor.on.unsandbox.com
              </code>
            </p>
            <CodeBlock language="bash" code={deployCommand} />
            <p className="text-sm text-foreground-tertiary mt-4">
              This creates an always-on service that runs the executor. HTTPS is automatically
              configured.
            </p>
          </section>

          {/* Test Your Deployment */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-foreground mb-4">Test Your Deployment</h2>
            <p className="text-foreground-secondary mb-4">
              Verify your executor is running with a health check:
            </p>
            <CodeBlock language="bash" code={healthCheck} />
            <p className="text-sm text-foreground-secondary mt-4 mb-2">Expected response:</p>
            <CodeBlock language="json" code={healthResponse} />
          </section>

          {/* Authentication */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-foreground mb-4">Add Authentication</h2>
            <div className="p-4 bg-warning/10 border border-warning/30 rounded-lg mb-4">
              <p className="text-sm text-warning">
                <strong>Important:</strong> Without an API key, anyone can execute tools on your
                executor. Always set{' '}
                <code className="px-1 bg-warning/20 rounded">EXECUTOR_API_KEY</code> in production.
              </p>
            </div>
            <p className="text-foreground-secondary mb-4">
              Deploy with an API key to require authentication:
            </p>
            <CodeBlock language="bash" code={deployWithApiKey} />
            <p className="text-sm text-foreground-tertiary mt-4">
              When configured, requests must include{' '}
              <code className="px-1 bg-surface rounded">Authorization: Bearer your-api-key</code>.
            </p>
          </section>

          {/* Environment Variables */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-foreground mb-4">Environment Variables</h2>
            <p className="text-foreground-secondary mb-4">
              Pass environment variables that your tools need. These are available during tool
              execution.
            </p>

            <h3 className="text-lg font-medium text-foreground mb-3">Inline Variables</h3>
            <CodeBlock language="bash" code={deployWithEnvVars} />

            <h3 className="text-lg font-medium text-foreground mt-6 mb-3">Using an Env File</h3>
            <CodeBlock language="bash" code={deployWithEnvFile} />

            <div className="p-4 bg-surface border border-border rounded-lg mt-4">
              <p className="text-sm text-foreground-secondary">
                All environment variables are stored encrypted and only available to your executor.
              </p>
            </div>
          </section>

          {/* Execute a Tool */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-foreground mb-4">Execute a Tool</h2>
            <p className="text-foreground-secondary mb-4">
              Test tool execution with a curl request:
            </p>
            <CodeBlock language="bash" code={executeExample} />
          </section>

          {/* Local Development */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-foreground mb-4">Local Development</h2>
            <p className="text-foreground-secondary mb-4">
              Run the executor locally for testing and development:
            </p>
            <CodeBlock language="bash" code={localDev} />
          </section>

          {/* Management Commands */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-foreground mb-4">Managing Your Service</h2>
            <p className="text-foreground-secondary mb-4">
              Unsandbox provides commands to manage your executor:
            </p>
            <CodeBlock language="bash" code={managementCommands} />

            <h3 className="text-lg font-medium text-foreground mt-6 mb-3">Cost Optimization</h3>
            <p className="text-foreground-secondary mb-4">
              Freeze your executor when not in use to stop billing:
            </p>
            <ul className="text-foreground-secondary text-sm space-y-2">
              <li>
                • <code className="px-1 bg-surface rounded">un service --freeze</code> stops the
                service and billing
              </li>
              <li>
                • <code className="px-1 bg-surface rounded">un service --unfreeze</code> restarts it
                when needed
              </li>
              <li>• Configure auto-unfreeze to wake on HTTP request (incurs cold start)</li>
            </ul>
          </section>

          {/* Custom Domains */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-foreground mb-4">Custom Domains</h2>
            <p className="text-foreground-secondary mb-4">
              Use your own domain instead of the default{' '}
              <code className="px-1 bg-surface rounded">*.on.unsandbox.com</code>:
            </p>
            <CodeBlock language="bash" code={customDomain} />
            <p className="text-foreground-secondary text-sm mt-4">
              After deploying, add a CNAME record pointing{' '}
              <code className="px-1 bg-surface rounded">executor.yourdomain.com</code> to your
              Unsandbox service domain.
            </p>
          </section>

          {/* How It Works */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-foreground mb-4">How It Works</h2>
            <p className="text-foreground-secondary mb-4">
              The Unsandbox executor runs as an always-on HTTP server:
            </p>
            <ol className="text-foreground-secondary space-y-3">
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-sm flex items-center justify-center">
                  1
                </span>
                <span>
                  Receives tool execution request via HTTP POST to{' '}
                  <code className="px-1 bg-surface rounded">/api/execute-tool</code>
                </span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-sm flex items-center justify-center">
                  2
                </span>
                <span>Creates an isolated temporary directory for the execution</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-sm flex items-center justify-center">
                  3
                </span>
                <span>
                  Installs the npm package using{' '}
                  <code className="px-1 bg-surface rounded">npm install</code>
                </span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-sm flex items-center justify-center">
                  4
                </span>
                <span>
                  Loads the tool and calls its{' '}
                  <code className="px-1 bg-surface rounded">execute()</code> function
                </span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-sm flex items-center justify-center">
                  5
                </span>
                <span>Returns the result and cleans up the temporary directory</span>
              </li>
            </ol>
            <p className="text-foreground-secondary text-sm mt-4">
              Since Unsandbox containers are already isolated, no additional sandbox layer is
              needed. Network access is controlled by Unsandbox&apos;s semitrusted mode.
            </p>
          </section>

          {/* Security */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-foreground mb-4">Security</h2>
            <ul className="text-foreground-secondary space-y-2">
              <li className="flex items-start gap-2">
                <Icon icon="check" className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                <span>
                  Set <code className="px-1 bg-surface rounded">EXECUTOR_API_KEY</code> to require
                  authentication
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Icon icon="check" className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                <span>Tools run in isolated Unsandbox containers</span>
              </li>
              <li className="flex items-start gap-2">
                <Icon icon="check" className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                <span>Each execution uses a fresh temporary directory</span>
              </li>
              <li className="flex items-start gap-2">
                <Icon icon="check" className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                <span>Network controlled by semitrusted mode</span>
              </li>
              <li className="flex items-start gap-2">
                <Icon icon="check" className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                <span>Environment variables stored encrypted</span>
              </li>
            </ul>
          </section>

          {/* Pricing */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-foreground mb-4">Pricing</h2>
            <p className="text-foreground-secondary mb-4">
              Unsandbox services are billed based on uptime. See{' '}
              <a
                href="https://unsandbox.com/pricing"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Unsandbox Pricing
              </a>{' '}
              for current rates.
            </p>
            <ul className="text-foreground-secondary text-sm space-y-2">
              <li>
                • HTTPS included via{' '}
                <code className="px-1 bg-surface rounded">*.on.unsandbox.com</code>
              </li>
              <li>• Freeze when not in use to pause billing</li>
              <li>• Scale vCPU and RAM as needed</li>
            </ul>
          </section>

          {/* Connect to TPMJS */}
          <section className="mb-12 p-6 bg-primary/5 border border-primary/20 rounded-lg">
            <h2 className="text-lg font-semibold text-foreground mb-4">Connect to TPMJS</h2>
            <ol className="text-foreground-secondary space-y-2">
              <li>1. Go to your collection or agent settings on TPMJS</li>
              <li>2. Select &quot;Custom Executor&quot; in Executor Configuration</li>
              <li>
                3. Enter URL:{' '}
                <code className="px-1.5 py-0.5 bg-surface rounded">
                  https://tpmjs-executor.on.unsandbox.com
                </code>
              </li>
              <li>4. Enter your API key (if configured)</li>
              <li>5. Click &quot;Verify Connection&quot;</li>
            </ol>
          </section>

          {/* Navigation */}
          <div className="flex items-center justify-start pt-8 border-t border-border">
            <Link
              href="/docs/executors/railway"
              className="flex items-center gap-2 text-foreground-secondary hover:text-foreground transition-colors"
            >
              <Icon icon="chevronLeft" className="w-4 h-4" />
              <span>Railway Guide</span>
            </Link>
          </div>
        </div>
      </main>

      <AppFooter />
    </div>
  );
}
