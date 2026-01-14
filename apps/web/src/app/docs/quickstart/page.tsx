import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@tpmjs/ui/Card/Card';
import { CodeBlock } from '@tpmjs/ui/CodeBlock/CodeBlock';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Quickstart Guide | TPMJS Docs',
  description: 'Get started with TPMJS in under 5 minutes',
};

export default function QuickstartPage(): React.ReactElement {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-4">Quickstart Guide</h1>
        <p className="text-foreground-secondary text-lg">
          Get your AI agent access to thousands of tools in under 5 minutes.
        </p>
      </div>

      {/* Prerequisites */}
      <Card>
        <CardHeader>
          <CardTitle>Prerequisites</CardTitle>
          <CardDescription>What you need before starting</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="list-disc list-inside space-y-2 text-foreground-secondary">
            <li>Node.js 18 or later</li>
            <li>npm, pnpm, or yarn</li>
            <li>
              An AI provider API key (OpenAI, Anthropic, or{' '}
              <a
                href="https://sdk.vercel.ai/providers/ai-sdk-providers"
                className="text-primary hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                any AI SDK provider
              </a>
              )
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Step 1: Installation */}
      <Card>
        <CardHeader>
          <CardTitle>Step 1: Install the SDK</CardTitle>
          <CardDescription>Add TPMJS packages to your project</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-foreground-secondary">
            Install the TPMJS SDK packages alongside the Vercel AI SDK:
          </p>

          <h4 className="font-semibold">npm</h4>
          <CodeBlock
            code="npm install @tpmjs/registry-search @tpmjs/registry-execute ai zod"
            language="bash"
            showCopy={true}
          />

          <h4 className="font-semibold">pnpm</h4>
          <CodeBlock
            code="pnpm add @tpmjs/registry-search @tpmjs/registry-execute ai zod"
            language="bash"
            showCopy={true}
          />

          <h4 className="font-semibold">yarn</h4>
          <CodeBlock
            code="yarn add @tpmjs/registry-search @tpmjs/registry-execute ai zod"
            language="bash"
            showCopy={true}
          />

          <p className="text-foreground-secondary text-sm mt-4">
            Also install your preferred AI provider SDK:
          </p>
          <CodeBlock
            code={`# Anthropic (Claude)
npm install @ai-sdk/anthropic

# OpenAI (GPT-4, etc.)
npm install @ai-sdk/openai

# Google (Gemini)
npm install @ai-sdk/google`}
            language="bash"
            showCopy={true}
          />
        </CardContent>
      </Card>

      {/* Step 2: Basic Usage */}
      <Card>
        <CardHeader>
          <CardTitle>Step 2: Add Tools to Your Agent</CardTitle>
          <CardDescription>Give your agent access to the TPMJS registry</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-foreground-secondary">
            Import the TPMJS tools and add them to your AI agent:
          </p>

          <CodeBlock
            code={`import { streamText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { registrySearchTool } from '@tpmjs/registry-search';
import { registryExecuteTool } from '@tpmjs/registry-execute';

// Create a streaming text generation with tools
const result = await streamText({
  model: anthropic('claude-sonnet-4-20250514'),
  tools: {
    registrySearch: registrySearchTool,
    registryExecute: registryExecuteTool,
  },
  system: \`You are a helpful assistant with access to thousands of tools
via the TPMJS registry. Use registrySearch to find tools for any task,
then registryExecute to run them.\`,
  prompt: 'Search for weather tools and get the current weather in Tokyo',
});

// Handle the streaming response
for await (const chunk of result.textStream) {
  process.stdout.write(chunk);
}`}
            language="typescript"
            showCopy={true}
          />
        </CardContent>
      </Card>

      {/* Step 3: Understanding the Tools */}
      <Card>
        <CardHeader>
          <CardTitle>Step 3: Understanding the Tools</CardTitle>
          <CardDescription>How registrySearch and registryExecute work</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h4 className="font-semibold mb-2">registrySearchTool</h4>
            <p className="text-foreground-secondary mb-2">
              Searches the TPMJS registry to find tools for any task. Returns metadata including the
              toolId needed for execution.
            </p>
            <CodeBlock
              code={`// The agent will call this tool to search for tools
{
  "query": "web scraping",
  "category": "web-scraping",  // optional
  "limit": 5                    // optional
}`}
              language="json"
              showCopy={true}
            />
          </div>

          <div>
            <h4 className="font-semibold mb-2">registryExecuteTool</h4>
            <p className="text-foreground-secondary mb-2">
              Executes any tool from the registry by its toolId. Tools run in a secure sandbox—no
              local installation required.
            </p>
            <CodeBlock
              code={`// The agent will call this tool to execute a tool
{
  "toolId": "@firecrawl/ai-sdk::scrapeTool",
  "params": { "url": "https://example.com" },
  "env": { "FIRECRAWL_API_KEY": "..." }  // optional
}`}
              language="json"
              showCopy={true}
            />
          </div>
        </CardContent>
      </Card>

      {/* Step 4: Passing API Keys */}
      <Card>
        <CardHeader>
          <CardTitle>Step 4: Configure API Keys</CardTitle>
          <CardDescription>Pre-configure API keys for tools that need them</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-foreground-secondary">
            Many tools require API keys (e.g., Firecrawl, Exa, Tavily). Create a wrapper to
            auto-inject your keys:
          </p>

          <h4 className="font-semibold">Create tools.ts</h4>
          <CodeBlock
            code={`import { tool } from 'ai';
import { registryExecuteTool } from '@tpmjs/registry-execute';

// Pre-configure your API keys
const API_KEYS: Record<string, string> = {
  FIRECRAWL_API_KEY: process.env.FIRECRAWL_API_KEY!,
  EXA_API_KEY: process.env.EXA_API_KEY!,
  TAVILY_API_KEY: process.env.TAVILY_API_KEY!,
};

// Create a wrapped version that auto-injects keys
export const registryExecute = tool({
  description: registryExecuteTool.description,
  parameters: registryExecuteTool.parameters,
  execute: async ({ toolId, params }) => {
    return registryExecuteTool.execute({ toolId, params, env: API_KEYS });
  },
});`}
            language="typescript"
            showCopy={true}
          />

          <h4 className="font-semibold">Use the wrapped tool</h4>
          <CodeBlock
            code={`import { registrySearchTool } from '@tpmjs/registry-search';
import { registryExecute } from './tools';

const result = await streamText({
  model: anthropic('claude-sonnet-4-20250514'),
  tools: {
    registrySearch: registrySearchTool,
    registryExecute,  // Uses your pre-configured keys
  },
  prompt: 'Scrape https://example.com',
});`}
            language="typescript"
            showCopy={true}
          />
        </CardContent>
      </Card>

      {/* Step 5: Real-World Example */}
      <Card>
        <CardHeader>
          <CardTitle>Step 5: Complete Example</CardTitle>
          <CardDescription>A full working example you can copy</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <h4 className="font-semibold">agent.ts</h4>
          <CodeBlock
            code={`import { streamText, generateText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { registrySearchTool } from '@tpmjs/registry-search';
import { registryExecuteTool } from '@tpmjs/registry-execute';

// Configure environment variables
const API_KEYS: Record<string, string> = {
  FIRECRAWL_API_KEY: process.env.FIRECRAWL_API_KEY || '',
  EXA_API_KEY: process.env.EXA_API_KEY || '',
};

// Create the wrapped execute tool
const registryExecute = {
  ...registryExecuteTool,
  execute: async (args: Parameters<typeof registryExecuteTool.execute>[0]) => {
    return registryExecuteTool.execute({
      ...args,
      env: { ...API_KEYS, ...args.env },
    });
  },
};

// Main agent function
async function runAgent(prompt: string) {
  const result = await generateText({
    model: anthropic('claude-sonnet-4-20250514'),
    tools: {
      registrySearch: registrySearchTool,
      registryExecute,
    },
    maxSteps: 5,  // Allow multiple tool calls
    system: \`You are a helpful assistant with access to thousands of tools.

Available tool workflow:
1. Use registrySearch to find tools for your task
2. Use registryExecute to run the tools you find
3. Synthesize the results into a helpful response

Always search for tools first before attempting to execute them.\`,
    prompt,
  });

  return result.text;
}

// Example usage
const response = await runAgent(
  'Search for web scraping tools, then scrape https://example.com and summarize it'
);
console.log(response);`}
            language="typescript"
            showCopy={true}
          />
        </CardContent>
      </Card>

      {/* Next Steps */}
      <Card>
        <CardHeader>
          <CardTitle>Next Steps</CardTitle>
          <CardDescription>Continue learning about TPMJS</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="space-y-3">
            <li>
              <Link href="/docs/sdk" className="text-primary hover:underline font-medium">
                SDK Documentation →
              </Link>
              <p className="text-foreground-secondary text-sm">
                Detailed reference for all SDK functions and options
              </p>
            </li>
            <li>
              <Link href="/docs/api/tools" className="text-primary hover:underline font-medium">
                Tools API Reference →
              </Link>
              <p className="text-foreground-secondary text-sm">
                REST API endpoints for searching and executing tools
              </p>
            </li>
            <li>
              <Link href="/docs/api/agents" className="text-primary hover:underline font-medium">
                Agents API Reference →
              </Link>
              <p className="text-foreground-secondary text-sm">
                Create and manage AI agents with TPMJS tools
              </p>
            </li>
            <li>
              <Link href="/publish" className="text-primary hover:underline font-medium">
                Publishing Guide →
              </Link>
              <p className="text-foreground-secondary text-sm">
                Learn how to publish your own tools to TPMJS
              </p>
            </li>
            <li>
              <Link href="/" className="text-primary hover:underline font-medium">
                Browse Tool Registry →
              </Link>
              <p className="text-foreground-secondary text-sm">
                Explore available tools and find ones for your use case
              </p>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Troubleshooting */}
      <Card>
        <CardHeader>
          <CardTitle>Common Issues</CardTitle>
          <CardDescription>Solutions to frequently encountered problems</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-foreground">
                Tool execution fails with &quot;missing API key&quot;
              </h4>
              <p className="text-foreground-secondary text-sm mt-1">
                Check that you&apos;re passing the required environment variables in the{' '}
                <code className="text-primary">env</code> parameter of registryExecute.
              </p>
              <CodeBlock
                code={`registryExecute.execute({
  toolId: '@firecrawl/ai-sdk::scrapeTool',
  params: { url: 'https://example.com' },
  env: { FIRECRAWL_API_KEY: process.env.FIRECRAWL_API_KEY }  // Required!
})`}
                language="typescript"
                showCopy={true}
              />
            </div>

            <div>
              <h4 className="font-semibold text-foreground">Tool not found in search results</h4>
              <p className="text-foreground-secondary text-sm mt-1">
                Try broader search terms or check the tool category. You can also browse the full
                registry at{' '}
                <Link href="/" className="text-primary hover:underline">
                  tpmjs.com
                </Link>
                .
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-foreground">Agent not using the tools</h4>
              <p className="text-foreground-secondary text-sm mt-1">
                Make sure your system prompt clearly instructs the agent to use registrySearch
                first, then registryExecute. Also ensure{' '}
                <code className="text-primary">maxSteps</code> is set high enough (default is 1).
              </p>
              <CodeBlock
                code={`const result = await generateText({
  model: anthropic('claude-sonnet-4-20250514'),
  tools: { registrySearch, registryExecute },
  maxSteps: 5,  // Allow multiple tool calls
  system: 'Use registrySearch to find tools, then registryExecute to run them.',
  prompt: 'Your prompt here',
});`}
                language="typescript"
                showCopy={true}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
