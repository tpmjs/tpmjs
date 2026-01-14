import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@tpmjs/ui/Card/Card';
import { CodeBlock } from '@tpmjs/ui/CodeBlock/CodeBlock';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'SDK Reference | TPMJS Docs',
  description: 'Complete reference for the TPMJS SDK packages',
};

export default function SdkPage(): React.ReactElement {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-4">SDK Reference</h1>
        <p className="text-foreground-secondary text-lg">
          Complete reference for the TPMJS SDK packages: @tpmjs/registry-search and
          @tpmjs/registry-execute.
        </p>
      </div>

      {/* Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Overview</CardTitle>
          <CardDescription>TPMJS SDK packages</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-foreground-secondary">
            The TPMJS SDK consists of two packages that give your AI agent access to the tool
            registry:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="p-4 border border-border rounded-lg">
              <h4 className="font-semibold text-foreground">@tpmjs/registry-search</h4>
              <p className="text-foreground-secondary text-sm mt-1">
                Search the TPMJS registry to find tools for any task
              </p>
            </div>
            <div className="p-4 border border-border rounded-lg">
              <h4 className="font-semibold text-foreground">@tpmjs/registry-execute</h4>
              <p className="text-foreground-secondary text-sm mt-1">
                Execute any tool from the registry in a secure sandbox
              </p>
            </div>
          </div>

          <h4 className="font-semibold mt-6">Installation</h4>
          <CodeBlock
            code="npm install @tpmjs/registry-search @tpmjs/registry-execute"
            language="bash"
            showCopy={true}
          />

          <h4 className="font-semibold">Peer Dependencies</h4>
          <p className="text-foreground-secondary text-sm">
            Both packages require <code className="text-primary">ai</code> (Vercel AI SDK) and{' '}
            <code className="text-primary">zod</code> as peer dependencies.
          </p>
          <CodeBlock code="npm install ai zod" language="bash" showCopy={true} />
        </CardContent>
      </Card>

      {/* registrySearchTool */}
      <Card>
        <CardHeader>
          <CardTitle>registrySearchTool</CardTitle>
          <CardDescription>@tpmjs/registry-search</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-foreground-secondary">
            An AI SDK tool that searches the TPMJS registry for tools matching a query.
          </p>

          <h4 className="font-semibold">Import</h4>
          <CodeBlock
            code={`import { registrySearchTool } from '@tpmjs/registry-search';`}
            language="typescript"
            showCopy={true}
          />

          <h4 className="font-semibold">Basic Usage</h4>
          <CodeBlock
            code={`import { generateText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { registrySearchTool } from '@tpmjs/registry-search';

const result = await generateText({
  model: anthropic('claude-sonnet-4-20250514'),
  tools: { registrySearch: registrySearchTool },
  prompt: 'Find tools for web scraping',
});`}
            language="typescript"
            showCopy={true}
          />

          <h4 className="font-semibold">Parameters</h4>
          <div className="overflow-x-auto border border-border rounded-lg">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface">
                  <th className="text-left py-3 px-4">Parameter</th>
                  <th className="text-left py-3 px-4">Type</th>
                  <th className="text-left py-3 px-4">Required</th>
                  <th className="text-left py-3 px-4">Description</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border">
                  <td className="py-3 px-4 font-mono text-primary">query</td>
                  <td className="py-3 px-4 font-mono">string</td>
                  <td className="py-3 px-4">Yes</td>
                  <td className="py-3 px-4 text-foreground-secondary">
                    Search query (keywords, tool names, descriptions)
                  </td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-3 px-4 font-mono text-primary">category</td>
                  <td className="py-3 px-4 font-mono">string</td>
                  <td className="py-3 px-4">No</td>
                  <td className="py-3 px-4 text-foreground-secondary">Filter by category</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-mono text-primary">limit</td>
                  <td className="py-3 px-4 font-mono">number</td>
                  <td className="py-3 px-4">No</td>
                  <td className="py-3 px-4 text-foreground-secondary">
                    Max results (1-20, default 5)
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <h4 className="font-semibold">Return Value</h4>
          <CodeBlock
            code={`interface SearchResult {
  query: string;
  matchCount: number;
  tools: Array<{
    toolId: string;           // Format: package::name
    name: string;             // Tool export name
    package: string;          // npm package name
    description: string;      // Tool description
    category: string;         // Tool category
    requiredEnvVars: string[]; // Required API keys
    healthStatus: 'HEALTHY' | 'UNHEALTHY' | 'UNKNOWN';
    qualityScore: number;     // 0.00 - 1.00
  }>;
}`}
            language="typescript"
            showCopy={true}
          />

          <h4 className="font-semibold">Available Categories</h4>
          <p className="text-foreground-secondary text-sm mb-2">
            Filter results by category to narrow down your search:
          </p>
          <div className="flex flex-wrap gap-2 text-sm">
            {[
              'web-scraping',
              'search-engines',
              'ai-models',
              'data-processing',
              'communication',
              'file-management',
              'code-execution',
              'database',
              'calendar',
              'e-commerce',
              'finance',
              'social-media',
              'weather',
              'maps',
              'translation',
              'image-processing',
              'audio-processing',
              'video-processing',
              'utilities',
              'other',
            ].map((cat) => (
              <code key={cat} className="px-2 py-1 bg-surface border border-border rounded">
                {cat}
              </code>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* registryExecuteTool */}
      <Card>
        <CardHeader>
          <CardTitle>registryExecuteTool</CardTitle>
          <CardDescription>@tpmjs/registry-execute</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-foreground-secondary">
            An AI SDK tool that executes any tool from the TPMJS registry in a secure sandbox.
          </p>

          <h4 className="font-semibold">Import</h4>
          <CodeBlock
            code={`import { registryExecuteTool } from '@tpmjs/registry-execute';`}
            language="typescript"
            showCopy={true}
          />

          <h4 className="font-semibold">Basic Usage</h4>
          <CodeBlock
            code={`import { generateText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { registryExecuteTool } from '@tpmjs/registry-execute';

const result = await generateText({
  model: anthropic('claude-sonnet-4-20250514'),
  tools: { registryExecute: registryExecuteTool },
  prompt: 'Execute the hello world tool',
});`}
            language="typescript"
            showCopy={true}
          />

          <h4 className="font-semibold">Parameters</h4>
          <div className="overflow-x-auto border border-border rounded-lg">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface">
                  <th className="text-left py-3 px-4">Parameter</th>
                  <th className="text-left py-3 px-4">Type</th>
                  <th className="text-left py-3 px-4">Required</th>
                  <th className="text-left py-3 px-4">Description</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border">
                  <td className="py-3 px-4 font-mono text-primary">toolId</td>
                  <td className="py-3 px-4 font-mono">string</td>
                  <td className="py-3 px-4">Yes</td>
                  <td className="py-3 px-4 text-foreground-secondary">
                    Tool identifier in format: package::name
                  </td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-3 px-4 font-mono text-primary">params</td>
                  <td className="py-3 px-4 font-mono">object</td>
                  <td className="py-3 px-4">Yes</td>
                  <td className="py-3 px-4 text-foreground-secondary">
                    Parameters to pass to the tool
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-mono text-primary">env</td>
                  <td className="py-3 px-4 font-mono">object</td>
                  <td className="py-3 px-4">No</td>
                  <td className="py-3 px-4 text-foreground-secondary">
                    Environment variables (API keys) to pass to the tool
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <h4 className="font-semibold">Return Value</h4>
          <CodeBlock
            code={`interface ExecuteResult {
  toolId: string;           // The executed tool ID
  executionTimeMs: number;  // Execution time in milliseconds
  output: unknown;          // Tool output (varies by tool)
}`}
            language="typescript"
            showCopy={true}
          />

          <h4 className="font-semibold">Passing API Keys</h4>
          <CodeBlock
            code={`// Direct usage with env parameter
const result = await registryExecuteTool.execute({
  toolId: '@firecrawl/ai-sdk::scrapeTool',
  params: { url: 'https://example.com' },
  env: { FIRECRAWL_API_KEY: process.env.FIRECRAWL_API_KEY },
});`}
            language="typescript"
            showCopy={true}
          />
        </CardContent>
      </Card>

      {/* Creating a Wrapped Execute Tool */}
      <Card>
        <CardHeader>
          <CardTitle>Creating a Wrapped Execute Tool</CardTitle>
          <CardDescription>Pre-configure API keys for seamless execution</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-foreground-secondary">
            Create a wrapper around registryExecuteTool to automatically inject your API keys:
          </p>

          <CodeBlock
            code={`import { tool } from 'ai';
import { registryExecuteTool } from '@tpmjs/registry-execute';

// Your pre-configured API keys
const API_KEYS: Record<string, string> = {
  FIRECRAWL_API_KEY: process.env.FIRECRAWL_API_KEY!,
  EXA_API_KEY: process.env.EXA_API_KEY!,
  TAVILY_API_KEY: process.env.TAVILY_API_KEY!,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY!,
};

// Wrapped tool with pre-configured keys
export const registryExecute = tool({
  description: registryExecuteTool.description,
  parameters: registryExecuteTool.parameters,
  execute: async ({ toolId, params }) => {
    return registryExecuteTool.execute({
      toolId,
      params,
      env: API_KEYS,
    });
  },
});`}
            language="typescript"
            showCopy={true}
          />
        </CardContent>
      </Card>

      {/* Direct API Usage */}
      <Card>
        <CardHeader>
          <CardTitle>Direct API Usage</CardTitle>
          <CardDescription>Use the SDK without AI agent integration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-foreground-secondary">
            Both tools can also be used directly without an AI agent:
          </p>

          <h4 className="font-semibold">Direct Search</h4>
          <CodeBlock
            code={`import { registrySearchTool } from '@tpmjs/registry-search';

// Search for tools directly
const searchResult = await registrySearchTool.execute({
  query: 'web scraping',
  limit: 5,
});

console.log('Found tools:', searchResult.tools);`}
            language="typescript"
            showCopy={true}
          />

          <h4 className="font-semibold">Direct Execution</h4>
          <CodeBlock
            code={`import { registryExecuteTool } from '@tpmjs/registry-execute';

// Execute a tool directly
const result = await registryExecuteTool.execute({
  toolId: '@tpmjs/hello::helloWorldTool',
  params: { name: 'World' },
});

console.log('Result:', result.output);`}
            language="typescript"
            showCopy={true}
          />
        </CardContent>
      </Card>

      {/* Environment Variables */}
      <Card>
        <CardHeader>
          <CardTitle>Environment Variables</CardTitle>
          <CardDescription>Configure SDK behavior</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-foreground-secondary">
            The SDK supports the following environment variables:
          </p>

          <div className="overflow-x-auto border border-border rounded-lg">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface">
                  <th className="text-left py-3 px-4">Variable</th>
                  <th className="text-left py-3 px-4">Default</th>
                  <th className="text-left py-3 px-4">Description</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border">
                  <td className="py-3 px-4 font-mono text-primary">TPMJS_API_URL</td>
                  <td className="py-3 px-4 font-mono text-foreground-secondary">
                    https://tpmjs.com
                  </td>
                  <td className="py-3 px-4 text-foreground-secondary">
                    Base URL for the TPMJS registry API
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-mono text-primary">TPMJS_EXECUTOR_URL</td>
                  <td className="py-3 px-4 font-mono text-foreground-secondary">
                    https://executor.tpmjs.com
                  </td>
                  <td className="py-3 px-4 text-foreground-secondary">
                    URL for the sandbox executor service
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <h4 className="font-semibold">Self-Hosting</h4>
          <p className="text-foreground-secondary text-sm">
            If you&apos;re running your own TPMJS registry, set these environment variables:
          </p>
          <CodeBlock
            code={`# .env
TPMJS_API_URL=https://registry.mycompany.com
TPMJS_EXECUTOR_URL=https://executor.mycompany.com`}
            language="bash"
            showCopy={true}
          />
        </CardContent>
      </Card>

      {/* TypeScript Types */}
      <Card>
        <CardHeader>
          <CardTitle>TypeScript Types</CardTitle>
          <CardDescription>Type definitions exported by the SDK</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <h4 className="font-semibold">@tpmjs/registry-search</h4>
          <CodeBlock
            code={`import type {
  SearchToolParams,
  SearchToolResult,
  ToolInfo,
} from '@tpmjs/registry-search';

// SearchToolParams
interface SearchToolParams {
  query: string;
  category?: string;
  limit?: number;
}

// SearchToolResult
interface SearchToolResult {
  query: string;
  matchCount: number;
  tools: ToolInfo[];
}

// ToolInfo
interface ToolInfo {
  toolId: string;
  name: string;
  package: string;
  description: string;
  category: string;
  requiredEnvVars: string[];
  healthStatus: 'HEALTHY' | 'UNHEALTHY' | 'UNKNOWN';
  qualityScore: number;
}`}
            language="typescript"
            showCopy={true}
          />

          <h4 className="font-semibold">@tpmjs/registry-execute</h4>
          <CodeBlock
            code={`import type {
  ExecuteToolParams,
  ExecuteToolResult,
} from '@tpmjs/registry-execute';

// ExecuteToolParams
interface ExecuteToolParams {
  toolId: string;
  params: Record<string, unknown>;
  env?: Record<string, string>;
}

// ExecuteToolResult
interface ExecuteToolResult {
  toolId: string;
  executionTimeMs: number;
  output: unknown;
}`}
            language="typescript"
            showCopy={true}
          />
        </CardContent>
      </Card>

      {/* Error Handling */}
      <Card>
        <CardHeader>
          <CardTitle>Error Handling</CardTitle>
          <CardDescription>Handle errors from the SDK</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-foreground-secondary">
            Both SDK tools throw errors that can be caught and handled:
          </p>

          <CodeBlock
            code={`import { registryExecuteTool } from '@tpmjs/registry-execute';

try {
  const result = await registryExecuteTool.execute({
    toolId: '@firecrawl/ai-sdk::scrapeTool',
    params: { url: 'https://example.com' },
    env: { FIRECRAWL_API_KEY: process.env.FIRECRAWL_API_KEY },
  });
  console.log('Success:', result);
} catch (error) {
  if (error instanceof Error) {
    console.error('Tool execution failed:', error.message);

    // Common error types:
    // - "Tool not found: ..." - Invalid toolId
    // - "Missing required env var: ..." - API key not provided
    // - "Execution timeout" - Tool took too long
    // - "Sandbox error: ..." - Tool runtime error
  }
}`}
            language="typescript"
            showCopy={true}
          />
        </CardContent>
      </Card>

      {/* Complete Example */}
      <Card>
        <CardHeader>
          <CardTitle>Complete Example</CardTitle>
          <CardDescription>Full agent implementation with both tools</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <CodeBlock
            code={`import { streamText, tool } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { registrySearchTool } from '@tpmjs/registry-search';
import { registryExecuteTool } from '@tpmjs/registry-execute';

// Pre-configure API keys
const API_KEYS: Record<string, string> = {
  FIRECRAWL_API_KEY: process.env.FIRECRAWL_API_KEY || '',
  EXA_API_KEY: process.env.EXA_API_KEY || '',
};

// Wrapped execute tool with pre-configured keys
const registryExecute = tool({
  description: registryExecuteTool.description,
  parameters: registryExecuteTool.parameters,
  execute: async ({ toolId, params }) => {
    return registryExecuteTool.execute({ toolId, params, env: API_KEYS });
  },
});

// System prompt that guides the agent
const systemPrompt = \`You are a helpful assistant with access to thousands of tools.

To complete tasks, follow this workflow:
1. Use registrySearch to find relevant tools
2. Review the search results and pick the best tool
3. Use registryExecute to run the tool with appropriate parameters
4. Synthesize the results into a helpful response

Always explain what you're doing and why.\`;

// Main function
async function runAgent(userPrompt: string) {
  const result = await streamText({
    model: anthropic('claude-sonnet-4-20250514'),
    tools: {
      registrySearch: registrySearchTool,
      registryExecute,
    },
    maxSteps: 10,
    system: systemPrompt,
    prompt: userPrompt,
  });

  // Stream the response
  for await (const chunk of result.textStream) {
    process.stdout.write(chunk);
  }

  console.log('\\n---');
  console.log('Tool calls:', (await result.toolCalls).length);
}

// Usage
await runAgent('Find a web scraping tool and scrape https://example.com');`}
            language="typescript"
            showCopy={true}
          />
        </CardContent>
      </Card>

      {/* Related Resources */}
      <Card>
        <CardHeader>
          <CardTitle>Related Resources</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            <li>
              <Link href="/docs/quickstart" className="text-primary hover:underline font-medium">
                Quickstart Guide →
              </Link>
              <p className="text-foreground-secondary text-sm">Get started in 5 minutes</p>
            </li>
            <li>
              <Link href="/docs/api/tools" className="text-primary hover:underline font-medium">
                Tools API Reference →
              </Link>
              <p className="text-foreground-secondary text-sm">REST API for the registry</p>
            </li>
            <li>
              <Link
                href="/docs/api/authentication"
                className="text-primary hover:underline font-medium"
              >
                Authentication →
              </Link>
              <p className="text-foreground-secondary text-sm">API key management</p>
            </li>
            <li>
              <a
                href="https://github.com/tpmjs/tpmjs"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline font-medium"
              >
                GitHub Repository →
              </a>
              <p className="text-foreground-secondary text-sm">Source code and issues</p>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
