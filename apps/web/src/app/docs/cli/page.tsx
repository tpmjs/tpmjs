import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@tpmjs/ui/Card/Card';
import { CodeBlock } from '@tpmjs/ui/CodeBlock/CodeBlock';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'CLI Reference | TPMJS Docs',
  description:
    'Complete reference for the TPMJS CLI — search, execute, and manage AI tools from your terminal.',
};

export default function CliPage(): React.ReactElement {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-4">CLI Reference</h1>
        <p className="text-foreground-secondary text-lg">
          The <code className="text-primary">tpm</code> command-line interface for searching,
          executing, and managing AI tools from your terminal.
        </p>
      </div>

      {/* Installation */}
      <Card>
        <CardHeader>
          <CardTitle>Installation</CardTitle>
          <CardDescription>Get started with the TPMJS CLI</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <CodeBlock code="npm install -g @tpmjs/cli" language="bash" showCopy={true} />
          <p className="text-foreground-secondary text-sm">
            This installs the <code className="text-primary">tpm</code> command globally. Requires
            Node.js 18 or later.
          </p>
          <p className="text-foreground-secondary text-sm">Verify your installation:</p>
          <CodeBlock code="tpm --version" language="bash" showCopy={true} />
        </CardContent>
      </Card>

      {/* Quick Start */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Start</CardTitle>
          <CardDescription>Common workflows to get up and running</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <CodeBlock
            code={`# Authenticate
tpm auth login

# Search for tools
tpm tool search firecrawl

# Show trending tools
tpm tool trending

# Get tool info
tpm tool info @tpmjs/official-firecrawl scrapeTool

# Execute a tool
tpm tool execute '@tpmjs/official-firecrawl::scrapeTool' --input '{"url":"https://example.com"}'

# Generate MCP config for your AI client
tpm mcp config ajax/my-collection`}
            language="bash"
            showCopy={true}
          />
        </CardContent>
      </Card>

      {/* Authentication */}
      <Card>
        <CardHeader>
          <CardTitle>Authentication</CardTitle>
          <CardDescription>Login and manage your credentials</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="overflow-x-auto border border-border rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-background-secondary">
                <tr>
                  <th className="text-left p-3 font-medium">Command</th>
                  <th className="text-left p-3 font-medium">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr>
                  <td className="p-3 font-mono text-primary">tpm auth login</td>
                  <td className="p-3 text-foreground-secondary">
                    Login with API key or browser OAuth
                  </td>
                </tr>
                <tr>
                  <td className="p-3 font-mono text-primary">tpm auth logout</td>
                  <td className="p-3 text-foreground-secondary">Log out and clear credentials</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono text-primary">tpm auth status</td>
                  <td className="p-3 text-foreground-secondary">Show authentication status</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono text-primary">tpm auth whoami</td>
                  <td className="p-3 text-foreground-secondary">Show current user info</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h4 className="font-semibold">Login Methods</h4>
          <CodeBlock
            code={`# Interactive browser OAuth
tpm auth login

# Direct API key
tpm auth login --api-key YOUR_API_KEY`}
            language="bash"
            showCopy={true}
          />
          <p className="text-foreground-secondary text-sm">
            You can also set the <code className="text-primary">TPMJS_API_KEY</code> environment
            variable to authenticate without logging in.
          </p>
        </CardContent>
      </Card>

      {/* Tools */}
      <Card>
        <CardHeader>
          <CardTitle>Tools</CardTitle>
          <CardDescription>Search, discover, execute, and create tools</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <h4 className="font-semibold">Search & Discovery</h4>
          <div className="overflow-x-auto border border-border rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-background-secondary">
                <tr>
                  <th className="text-left p-3 font-medium">Command</th>
                  <th className="text-left p-3 font-medium">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr>
                  <td className="p-3 font-mono text-primary">tpm tool search [query]</td>
                  <td className="p-3 text-foreground-secondary">
                    Search for tools in the registry
                  </td>
                </tr>
                <tr>
                  <td className="p-3 font-mono text-primary">tpm tool trending</td>
                  <td className="p-3 text-foreground-secondary">Show trending tools</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono text-primary">
                    tpm tool info &lt;package&gt; &lt;tool&gt;
                  </td>
                  <td className="p-3 text-foreground-secondary">Get detailed tool information</td>
                </tr>
              </tbody>
            </table>
          </div>

          <CodeBlock
            code={`# Search by name
tpm tool search firecrawl

# Show more trending results
tpm tool trending --limit 20

# Get detailed info about a specific tool
tpm tool info @tpmjs/official-firecrawl scrapeTool`}
            language="bash"
            showCopy={true}
          />

          <h4 className="font-semibold">Execute Tools</h4>
          <p className="text-foreground-secondary text-sm">
            Run tools directly from the registry with JSON input:
          </p>
          <div className="overflow-x-auto border border-border rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-background-secondary">
                <tr>
                  <th className="text-left p-3 font-medium">Flag</th>
                  <th className="text-left p-3 font-medium">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr>
                  <td className="p-3 font-mono text-primary">--input, -i</td>
                  <td className="p-3 text-foreground-secondary">Input parameters as JSON string</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono text-primary">--input-file, -f</td>
                  <td className="p-3 text-foreground-secondary">Path to JSON file with input</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono text-primary">--stream, -s</td>
                  <td className="p-3 text-foreground-secondary">Stream output</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono text-primary">--timeout, -t</td>
                  <td className="p-3 text-foreground-secondary">
                    Timeout in seconds (default: 300)
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <CodeBlock
            code={`# Execute with inline JSON
tpm tool execute '@tpmjs/official-firecrawl::scrapeTool' --input '{"url":"https://example.com"}'

# Execute with input from file
tpm tool execute '@scope/package::toolName' --input-file params.json

# Stream results
tpm tool execute '@scope/package::toolName' --stream`}
            language="bash"
            showCopy={true}
          />

          <h4 className="font-semibold">Create & Validate</h4>
          <CodeBlock
            code={`# Initialize a new tool package (interactive)
tpm tool init

# Initialize with a name and template
tpm tool init my-tool --template rich

# Validate local tpmjs config in package.json
tpm tool validate`}
            language="bash"
            showCopy={true}
          />
          <p className="text-foreground-secondary text-sm">
            Available categories: <code className="text-primary">research</code>,{' '}
            <code className="text-primary">web</code>, <code className="text-primary">data</code>,{' '}
            <code className="text-primary">documentation</code>,{' '}
            <code className="text-primary">engineering</code>,{' '}
            <code className="text-primary">security</code>,{' '}
            <code className="text-primary">statistics</code>,{' '}
            <code className="text-primary">ops</code>, <code className="text-primary">agent</code>,{' '}
            <code className="text-primary">sandbox</code>,{' '}
            <code className="text-primary">utilities</code>,{' '}
            <code className="text-primary">html</code>,{' '}
            <code className="text-primary">compliance</code>.
          </p>
        </CardContent>
      </Card>

      {/* Agents */}
      <Card>
        <CardHeader>
          <CardTitle>Agents</CardTitle>
          <CardDescription>Create and interact with AI agents</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-x-auto border border-border rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-background-secondary">
                <tr>
                  <th className="text-left p-3 font-medium">Command</th>
                  <th className="text-left p-3 font-medium">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr>
                  <td className="p-3 font-mono text-primary">tpm agent list</td>
                  <td className="p-3 text-foreground-secondary">List your agents</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono text-primary">tpm agent create</td>
                  <td className="p-3 text-foreground-secondary">Create a new agent</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono text-primary">tpm agent update &lt;id&gt;</td>
                  <td className="p-3 text-foreground-secondary">Update an agent</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono text-primary">tpm agent delete &lt;id&gt;</td>
                  <td className="p-3 text-foreground-secondary">Delete an agent</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono text-primary">tpm agent chat &lt;id&gt;</td>
                  <td className="p-3 text-foreground-secondary">Interactive chat with an agent</td>
                </tr>
              </tbody>
            </table>
          </div>
          <CodeBlock
            code={`# Interactive chat session
tpm agent chat <agent-id>

# Send a single message
tpm agent chat <agent-id> "What tools can help with web scraping?"`}
            language="bash"
            showCopy={true}
          />
        </CardContent>
      </Card>

      {/* Collections */}
      <Card>
        <CardHeader>
          <CardTitle>Collections</CardTitle>
          <CardDescription>Organize and share groups of tools</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <h4 className="font-semibold">Manage Collections</h4>
          <div className="overflow-x-auto border border-border rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-background-secondary">
                <tr>
                  <th className="text-left p-3 font-medium">Command</th>
                  <th className="text-left p-3 font-medium">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr>
                  <td className="p-3 font-mono text-primary">tpm collection list</td>
                  <td className="p-3 text-foreground-secondary">List your collections</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono text-primary">tpm collection create</td>
                  <td className="p-3 text-foreground-secondary">Create a new collection</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono text-primary">
                    tpm collection info &lt;user/slug&gt;
                  </td>
                  <td className="p-3 text-foreground-secondary">
                    Show collection details and tools
                  </td>
                </tr>
                <tr>
                  <td className="p-3 font-mono text-primary">tpm collection update &lt;id&gt;</td>
                  <td className="p-3 text-foreground-secondary">Update collection metadata</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono text-primary">tpm collection delete &lt;id&gt;</td>
                  <td className="p-3 text-foreground-secondary">Delete a collection</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h4 className="font-semibold">Manage Tools in Collections</h4>
          <CodeBlock
            code={`# Add tools by ID
tpm collection add my-collection tool-id-1 tool-id-2

# Add tools from an npm package
tpm collection add my-collection --package @org/my-tools

# Search for tools and add them in one step
tpm collection add my-collection --search "firecrawl"
tpm collection add my-collection --search "web scraper" --category web --limit 3

# Remove a tool
tpm collection remove my-collection tool-id

# Import from file (IDs, one per line or JSON array)
tpm collection import my-collection --file tools.txt

# Update metadata
tpm collection update my-col --name "New Name" --public
tpm collection update my-col --no-public  # Make private`}
            language="bash"
            showCopy={true}
          />
        </CardContent>
      </Card>

      {/* Run */}
      <Card>
        <CardHeader>
          <CardTitle>Run Tools via MCP</CardTitle>
          <CardDescription>Execute tools from collections using the MCP protocol</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-foreground-secondary text-sm">
            The <code className="text-primary">tpm run</code> command executes a tool from a
            collection via the MCP API:
          </p>
          <CodeBlock
            code={`# Basic usage
tpm run -c ajax/unsandbox -t execute --args '{"code":"print(1)","language":"python"}'

# With environment variables
tpm run -c ajax/my-collection -t myTool --env API_KEY=xxx --env DEBUG=true

# Using process environment
OPENAI_API_KEY=xxx tpm run -c ajax/ai-tools -t generate

# JSON output for scripting
tpm run -c ajax/tools -t base64Encode --args '{"data":"hello"}' --json | jq .result`}
            language="bash"
            showCopy={true}
          />
        </CardContent>
      </Card>

      {/* Scenarios */}
      <Card>
        <CardHeader>
          <CardTitle>Scenarios</CardTitle>
          <CardDescription>Test collections with AI-powered scenario testing</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-x-auto border border-border rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-background-secondary">
                <tr>
                  <th className="text-left p-3 font-medium">Command</th>
                  <th className="text-left p-3 font-medium">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr>
                  <td className="p-3 font-mono text-primary">tpm scenario list [collection]</td>
                  <td className="p-3 text-foreground-secondary">
                    List scenarios (all public, or for a collection)
                  </td>
                </tr>
                <tr>
                  <td className="p-3 font-mono text-primary">tpm scenario info &lt;id&gt;</td>
                  <td className="p-3 text-foreground-secondary">
                    Show scenario details and recent runs
                  </td>
                </tr>
                <tr>
                  <td className="p-3 font-mono text-primary">
                    tpm scenario generate &lt;collection&gt;
                  </td>
                  <td className="p-3 text-foreground-secondary">
                    Generate AI-powered test scenarios
                  </td>
                </tr>
                <tr>
                  <td className="p-3 font-mono text-primary">
                    tpm scenario run &lt;collection&gt;
                  </td>
                  <td className="p-3 text-foreground-secondary">
                    Run all scenarios for a collection
                  </td>
                </tr>
                <tr>
                  <td className="p-3 font-mono text-primary">tpm scenario test &lt;id&gt;</td>
                  <td className="p-3 text-foreground-secondary">Run a single scenario</td>
                </tr>
              </tbody>
            </table>
          </div>

          <CodeBlock
            code={`# Generate 3 test scenarios for a collection
tpm scenario generate my-collection --count 3

# Run all scenarios and see pass rates
tpm scenario run my-collection

# Test a specific scenario
tpm scenario test clu123abc456 --verbose`}
            language="bash"
            showCopy={true}
          />
        </CardContent>
      </Card>

      {/* MCP Integration */}
      <Card>
        <CardHeader>
          <CardTitle>MCP Integration</CardTitle>
          <CardDescription>
            Connect collections to AI clients via Model Context Protocol
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-foreground-secondary text-sm">
            Generate MCP configuration for popular AI clients, or run the CLI as a local MCP server.
          </p>
          <CodeBlock
            code={`# Auto-detect client
tpm mcp config ajax/my-collection

# For specific clients
tpm mcp config ajax/my-col --client claude     # Claude Desktop
tpm mcp config ajax/my-col --client cursor     # Cursor
tpm mcp config ajax/my-col --client windsurf   # Windsurf

# Run as local MCP server
tpm mcp serve                                  # HTTP on port 3333
tpm mcp serve --stdio                          # stdio mode`}
            language="bash"
            showCopy={true}
          />
          <p className="text-foreground-secondary text-sm">
            See the{' '}
            <Link href="/docs#mcp-overview" className="text-primary hover:underline">
              MCP Collections docs
            </Link>{' '}
            for more on connecting clients.
          </p>
        </CardContent>
      </Card>

      {/* Publishing */}
      <Card>
        <CardHeader>
          <CardTitle>Publishing</CardTitle>
          <CardDescription>Check and preview your tools before publishing</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <CodeBlock
            code={`# Check if your package has been discovered on tpmjs.com
tpm publish check @myorg/my-tool
tpm publish check              # Check current directory's package

# Preview how your tool will appear
tpm publish preview
tpm publish preview --path ./my-tool`}
            language="bash"
            showCopy={true}
          />
          <p className="text-foreground-secondary text-sm">
            Tools are discovered automatically from npm. Add the{' '}
            <code className="text-primary">tpmjs</code> keyword to your package.json to be indexed.
            See the{' '}
            <Link href="/docs#publish-overview" className="text-primary hover:underline">
              Publishing Guide
            </Link>{' '}
            for details.
          </p>
        </CardContent>
      </Card>

      {/* Utilities */}
      <Card>
        <CardHeader>
          <CardTitle>Utilities</CardTitle>
          <CardDescription>Diagnostics, playground, and updates</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-x-auto border border-border rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-background-secondary">
                <tr>
                  <th className="text-left p-3 font-medium">Command</th>
                  <th className="text-left p-3 font-medium">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr>
                  <td className="p-3 font-mono text-primary">tpm doctor</td>
                  <td className="p-3 text-foreground-secondary">
                    Run diagnostic checks (Node.js, config, auth, API, disk)
                  </td>
                </tr>
                <tr>
                  <td className="p-3 font-mono text-primary">tpm playground</td>
                  <td className="p-3 text-foreground-secondary">Interactive tool testing REPL</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono text-primary">tpm update</td>
                  <td className="p-3 text-foreground-secondary">Update CLI to latest version</td>
                </tr>
              </tbody>
            </table>
          </div>

          <CodeBlock
            code={`# Run diagnostics
tpm doctor --verbose

# Open the interactive playground
tpm playground
tpm playground --web   # Open web version
tpm playground --tool firecrawl-scrape   # Start with a specific tool`}
            language="bash"
            showCopy={true}
          />
        </CardContent>
      </Card>

      {/* Global Flags */}
      <Card>
        <CardHeader>
          <CardTitle>Global Flags</CardTitle>
          <CardDescription>Available on all commands</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-x-auto border border-border rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-background-secondary">
                <tr>
                  <th className="text-left p-3 font-medium">Flag</th>
                  <th className="text-left p-3 font-medium">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr>
                  <td className="p-3 font-mono text-primary">--json</td>
                  <td className="p-3 text-foreground-secondary">
                    Output in JSON format (for scripting)
                  </td>
                </tr>
                <tr>
                  <td className="p-3 font-mono text-primary">--verbose, -v</td>
                  <td className="p-3 text-foreground-secondary">Show detailed/debug output</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono text-primary">--help</td>
                  <td className="p-3 text-foreground-secondary">Show command help</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono text-primary">--version</td>
                  <td className="p-3 text-foreground-secondary">Show CLI version</td>
                </tr>
              </tbody>
            </table>
          </div>

          <CodeBlock
            code={`# JSON output for scripting
tpm tool search firecrawl --json | jq '.data[0].name'

# Verbose mode for debugging
tpm doctor --verbose`}
            language="bash"
            showCopy={true}
          />
        </CardContent>
      </Card>

      {/* Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Configuration</CardTitle>
          <CardDescription>Config files and environment variables</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-foreground-secondary text-sm">
            Configuration is stored in <code className="text-primary">~/.tpmjs/config.json</code>:
          </p>
          <CodeBlock
            code={`{
  "apiUrl": "https://tpmjs.com/api",
  "defaultOutput": "human",
  "verbose": false,
  "analytics": false
}`}
            language="json"
            showCopy={true}
          />

          <p className="text-foreground-secondary text-sm">
            Credentials are stored securely in{' '}
            <code className="text-primary">~/.tpmjs/credentials.json</code> with restricted file
            permissions (0600).
          </p>

          <h4 className="font-semibold">Environment Variables</h4>
          <div className="overflow-x-auto border border-border rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-background-secondary">
                <tr>
                  <th className="text-left p-3 font-medium">Variable</th>
                  <th className="text-left p-3 font-medium">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr>
                  <td className="p-3 font-mono text-primary">TPMJS_API_KEY</td>
                  <td className="p-3 text-foreground-secondary">API key for authentication</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono text-primary">TPMJS_API_URL</td>
                  <td className="p-3 text-foreground-secondary">
                    Custom API URL (default: https://tpmjs.com/api)
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Programmatic Usage */}
      <Card>
        <CardHeader>
          <CardTitle>Programmatic Usage</CardTitle>
          <CardDescription>Use the CLI as a library in Node.js</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-foreground-secondary text-sm">
            The CLI also exports a client library for programmatic use:
          </p>
          <CodeBlock
            code={`import { TpmClient } from '@tpmjs/cli';

const client = new TpmClient({ apiKey: 'your-key' });
const tools = await client.searchTools('firecrawl');`}
            language="typescript"
            showCopy={true}
          />
        </CardContent>
      </Card>

      {/* Next Steps */}
      <Card>
        <CardHeader>
          <CardTitle>Next Steps</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-foreground-secondary">
            <li>
              <Link href="/docs/quickstart" className="text-primary hover:underline">
                Quickstart Guide
              </Link>{' '}
              — Get your AI agent access to tools in under 5 minutes
            </li>
            <li>
              <Link href="/docs/sdk" className="text-primary hover:underline">
                SDK Reference
              </Link>{' '}
              — Use tools programmatically with the Vercel AI SDK
            </li>
            <li>
              <Link href="/docs#mcp-overview" className="text-primary hover:underline">
                MCP Collections
              </Link>{' '}
              — Connect tool collections to AI clients
            </li>
            <li>
              <Link href="/docs#publish-overview" className="text-primary hover:underline">
                Publishing Guide
              </Link>{' '}
              — Publish your own tools to the registry
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
