import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@tpmjs/ui/Card/Card';
import { CodeBlock } from '@tpmjs/ui/CodeBlock/CodeBlock';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tools API | TPMJS Docs',
  description: 'API reference for TPMJS tools endpoints',
};

export default function ToolsApiPage(): React.ReactElement {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-4">Tools API</h1>
        <p className="text-foreground-secondary text-lg">
          The Tools API allows you to search, discover, and execute TPMJS tools programmatically.
        </p>
      </div>

      {/* List Tools */}
      <Card>
        <CardHeader>
          <CardTitle>List Tools</CardTitle>
          <CardDescription>GET /api/tools</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-foreground-secondary">
            Retrieve a paginated list of tools with optional filtering.
          </p>

          <h4 className="font-semibold">Query Parameters</h4>
          <ul className="list-disc list-inside space-y-1 text-foreground-secondary">
            <li>
              <code>limit</code> - Number of results (default: 20, max: 50)
            </li>
            <li>
              <code>offset</code> - Pagination offset
            </li>
            <li>
              <code>category</code> - Filter by category
            </li>
            <li>
              <code>q</code> - Search query
            </li>
          </ul>

          <h4 className="font-semibold">Example Request</h4>
          <CodeBlock
            code={`curl "https://tpmjs.com/api/tools?category=communication&limit=10"`}
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
      "name": "discordPostTool",
      "description": "Post messages to Discord channels",
      "qualityScore": 0.85,
      "package": {
        "npmPackageName": "@tpmjs/discord-post",
        "category": "communication"
      }
    }
  ],
  "pagination": {
    "limit": 10,
    "offset": 0,
    "hasMore": true
  }
}`}
            language="json"
            showCopy={true}
          />
        </CardContent>
      </Card>

      {/* Get Tool by ID */}
      <Card>
        <CardHeader>
          <CardTitle>Get Tool</CardTitle>
          <CardDescription>GET /api/tools/:id</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-foreground-secondary">
            Retrieve detailed information about a specific tool.
          </p>

          <h4 className="font-semibold">Path Parameters</h4>
          <ul className="list-disc list-inside space-y-1 text-foreground-secondary">
            <li>
              <code>id</code> - Tool ID or package/tool slug
            </li>
          </ul>

          <h4 className="font-semibold">Example Request</h4>
          <CodeBlock
            code={`curl "https://tpmjs.com/api/tools/@tpmjs/discord-post/discordPostTool"`}
            language="bash"
            showCopy={true}
          />
        </CardContent>
      </Card>

      {/* Execute Tool */}
      <Card>
        <CardHeader>
          <CardTitle>Execute Tool</CardTitle>
          <CardDescription>POST /api/tools/execute/:slug</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-foreground-secondary">
            Execute a tool with an AI agent. Returns streaming SSE response.
          </p>

          <h4 className="font-semibold">Request Body</h4>
          <CodeBlock
            code={`{
  "prompt": "Send a hello message to #general channel",
  "parameters": {
    "channel": "#general"
  }
}`}
            language="json"
            showCopy={true}
          />

          <h4 className="font-semibold">TypeScript Example</h4>
          <CodeBlock
            code={`import { executeToolCall } from '@tpmjs/registry-execute';

const result = await executeToolCall({
  toolId: '@tpmjs/discord-post/discordPostTool',
  prompt: 'Send hello to #general',
  apiKey: 'your-api-key',
  onChunk: (text) => console.log(text),
});

console.log(result.output);`}
            language="typescript"
            showCopy={true}
          />
        </CardContent>
      </Card>

      {/* Trending Tools */}
      <Card>
        <CardHeader>
          <CardTitle>Trending Tools</CardTitle>
          <CardDescription>GET /api/tools/trending</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-foreground-secondary">
            Get trending tools based on downloads, ratings, and activity.
          </p>

          <h4 className="font-semibold">Query Parameters</h4>
          <ul className="list-disc list-inside space-y-1 text-foreground-secondary">
            <li>
              <code>period</code> - Time period: day, week, month, all (default: week)
            </li>
            <li>
              <code>category</code> - Filter by category
            </li>
            <li>
              <code>limit</code> - Number of results (default: 20)
            </li>
          </ul>

          <h4 className="font-semibold">Example Request</h4>
          <CodeBlock
            code={`curl "https://tpmjs.com/api/tools/trending?period=week&limit=10"`}
            language="bash"
            showCopy={true}
          />
        </CardContent>
      </Card>

      {/* Rate Tool */}
      <Card>
        <CardHeader>
          <CardTitle>Rate Tool</CardTitle>
          <CardDescription>POST /api/tools/:id/rate</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-foreground-secondary">
            Rate a tool from 1-5 stars. Requires authentication.
          </p>

          <h4 className="font-semibold">Request Body</h4>
          <CodeBlock
            code={`{
  "rating": 5
}`}
            language="json"
            showCopy={true}
          />

          <h4 className="font-semibold">Example Response</h4>
          <CodeBlock
            code={`{
  "success": true,
  "data": {
    "userRating": 5,
    "averageRating": 4.5,
    "ratingCount": 42
  }
}`}
            language="json"
            showCopy={true}
          />
        </CardContent>
      </Card>
    </div>
  );
}
