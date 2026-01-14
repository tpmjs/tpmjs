import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@tpmjs/ui/Card/Card';
import { CodeBlock } from '@tpmjs/ui/CodeBlock/CodeBlock';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Agents API | TPMJS Docs',
  description: 'API reference for TPMJS agents endpoints',
};

export default function AgentsApiPage(): React.ReactElement {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-4">Agents API</h1>
        <p className="text-foreground-secondary text-lg">
          The Agents API allows you to manage and interact with AI agents that can use TPMJS tools.
        </p>
      </div>

      {/* List User Agents */}
      <Card>
        <CardHeader>
          <CardTitle>List Agents</CardTitle>
          <CardDescription>GET /api/agents</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-foreground-secondary">
            Retrieve a list of your agents. Requires authentication.
          </p>

          <h4 className="font-semibold">Example Request</h4>
          <CodeBlock
            code={`curl -H "Authorization: Bearer YOUR_API_KEY" \\
  "https://tpmjs.com/api/agents"`}
            language="bash"
            showCopy={true}
          />

          <h4 className="font-semibold">Example Response</h4>
          <CodeBlock
            code={`{
  "success": true,
  "data": [
    {
      "id": "clx123abc",
      "uid": "my-assistant",
      "name": "My Assistant",
      "description": "A helpful AI assistant",
      "provider": "ANTHROPIC",
      "modelId": "claude-3-5-sonnet-20241022",
      "isPublic": true,
      "likeCount": 15
    }
  ]
}`}
            language="json"
            showCopy={true}
          />
        </CardContent>
      </Card>

      {/* Create Agent */}
      <Card>
        <CardHeader>
          <CardTitle>Create Agent</CardTitle>
          <CardDescription>POST /api/agents</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-foreground-secondary">
            Create a new AI agent with specified configuration.
          </p>

          <h4 className="font-semibold">Request Body</h4>
          <CodeBlock
            code={`{
  "name": "My Assistant",
  "description": "A helpful AI assistant",
  "uid": "my-assistant",
  "provider": "ANTHROPIC",
  "modelId": "claude-3-5-sonnet-20241022",
  "systemPrompt": "You are a helpful assistant...",
  "temperature": 0.7,
  "isPublic": true
}`}
            language="json"
            showCopy={true}
          />

          <h4 className="font-semibold">TypeScript Example</h4>
          <CodeBlock
            code={`const response = await fetch('/api/agents', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_API_KEY'
  },
  body: JSON.stringify({
    name: 'My Assistant',
    uid: 'my-assistant',
    provider: 'ANTHROPIC',
    modelId: 'claude-3-5-sonnet-20241022'
  })
});

const { data: agent } = await response.json();`}
            language="typescript"
            showCopy={true}
          />
        </CardContent>
      </Card>

      {/* Chat with Agent */}
      <Card>
        <CardHeader>
          <CardTitle>Chat with Agent</CardTitle>
          <CardDescription>POST /api/agents/:uid/chat</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-foreground-secondary">
            Send a message to an agent and receive a streaming response. The agent can use any tools
            attached to it.
          </p>

          <h4 className="font-semibold">Request Body</h4>
          <CodeBlock
            code={`{
  "message": "What's the weather in San Francisco?",
  "conversationId": "conv-123" // optional
}`}
            language="json"
            showCopy={true}
          />

          <h4 className="font-semibold">TypeScript Example</h4>
          <CodeBlock
            code={`const response = await fetch('/api/agents/my-assistant/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: 'What is the weather in San Francisco?'
  })
});

// Handle SSE stream
const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  const text = decoder.decode(value);
  console.log(text);
}`}
            language="typescript"
            showCopy={true}
          />
        </CardContent>
      </Card>

      {/* Add Tool to Agent */}
      <Card>
        <CardHeader>
          <CardTitle>Add Tool to Agent</CardTitle>
          <CardDescription>POST /api/agents/:uid/tools</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-foreground-secondary">
            Add a tool to an agent&apos;s available tools.
          </p>

          <h4 className="font-semibold">Request Body</h4>
          <CodeBlock
            code={`{
  "toolId": "clx123abc"
}`}
            language="json"
            showCopy={true}
          />
        </CardContent>
      </Card>

      {/* Add Collection to Agent */}
      <Card>
        <CardHeader>
          <CardTitle>Add Collection to Agent</CardTitle>
          <CardDescription>POST /api/agents/:uid/collections</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-foreground-secondary">Add all tools from a collection to an agent.</p>

          <h4 className="font-semibold">Request Body</h4>
          <CodeBlock
            code={`{
  "collectionId": "clx456def"
}`}
            language="json"
            showCopy={true}
          />
        </CardContent>
      </Card>
    </div>
  );
}
