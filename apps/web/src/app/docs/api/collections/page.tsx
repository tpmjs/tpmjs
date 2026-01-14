import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@tpmjs/ui/Card/Card';
import { CodeBlock } from '@tpmjs/ui/CodeBlock/CodeBlock';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Collections API | TPMJS Docs',
  description: 'API reference for TPMJS collections endpoints',
};

export default function CollectionsApiPage(): React.ReactElement {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-4">Collections API</h1>
        <p className="text-foreground-secondary text-lg">
          The Collections API allows you to create and manage curated sets of tools for specific use
          cases.
        </p>
      </div>

      {/* List Collections */}
      <Card>
        <CardHeader>
          <CardTitle>List Collections</CardTitle>
          <CardDescription>GET /api/collections</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-foreground-secondary">
            Retrieve a paginated list of public collections with optional filtering.
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
              <code>q</code> - Search query
            </li>
          </ul>

          <h4 className="font-semibold">Example Request</h4>
          <CodeBlock
            code={`curl "https://tpmjs.com/api/collections?limit=10"`}
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
      "uid": "web-scraping-toolkit",
      "name": "Web Scraping Toolkit",
      "description": "Essential tools for web scraping and data extraction",
      "isPublic": true,
      "toolCount": 5,
      "likeCount": 42,
      "owner": {
        "id": "user123",
        "name": "John Doe",
        "username": "johndoe"
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

      {/* Get Collection */}
      <Card>
        <CardHeader>
          <CardTitle>Get Collection</CardTitle>
          <CardDescription>GET /api/collections/:uid</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-foreground-secondary">
            Retrieve detailed information about a specific collection, including its tools.
          </p>

          <h4 className="font-semibold">Path Parameters</h4>
          <ul className="list-disc list-inside space-y-1 text-foreground-secondary">
            <li>
              <code>uid</code> - Collection unique identifier or slug
            </li>
          </ul>

          <h4 className="font-semibold">Example Request</h4>
          <CodeBlock
            code={`curl "https://tpmjs.com/api/collections/web-scraping-toolkit"`}
            language="bash"
            showCopy={true}
          />

          <h4 className="font-semibold">Example Response</h4>
          <CodeBlock
            code={`{
  "success": true,
  "data": {
    "id": "clx123abc",
    "uid": "web-scraping-toolkit",
    "name": "Web Scraping Toolkit",
    "description": "Essential tools for web scraping and data extraction",
    "isPublic": true,
    "toolCount": 5,
    "likeCount": 42,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-20T14:45:00Z",
    "tools": [
      {
        "id": "tool123",
        "name": "webScraperTool",
        "description": "Scrape content from web pages"
      }
    ],
    "owner": {
      "id": "user123",
      "name": "John Doe",
      "username": "johndoe"
    }
  }
}`}
            language="json"
            showCopy={true}
          />
        </CardContent>
      </Card>

      {/* Create Collection */}
      <Card>
        <CardHeader>
          <CardTitle>Create Collection</CardTitle>
          <CardDescription>POST /api/collections</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-foreground-secondary">
            Create a new collection. Requires authentication.
          </p>

          <h4 className="font-semibold">Request Body</h4>
          <CodeBlock
            code={`{
  "name": "My Data Tools",
  "uid": "my-data-tools",
  "description": "A collection of data processing tools",
  "isPublic": true
}`}
            language="json"
            showCopy={true}
          />

          <h4 className="font-semibold">TypeScript Example</h4>
          <CodeBlock
            code={`const response = await fetch('/api/collections', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_API_KEY'
  },
  body: JSON.stringify({
    name: 'My Data Tools',
    uid: 'my-data-tools',
    description: 'A collection of data processing tools',
    isPublic: true
  })
});

const { data: collection } = await response.json();
console.log('Created collection:', collection.id);`}
            language="typescript"
            showCopy={true}
          />
        </CardContent>
      </Card>

      {/* Update Collection */}
      <Card>
        <CardHeader>
          <CardTitle>Update Collection</CardTitle>
          <CardDescription>PATCH /api/collections/:uid</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-foreground-secondary">
            Update an existing collection. Requires authentication and ownership.
          </p>

          <h4 className="font-semibold">Request Body</h4>
          <CodeBlock
            code={`{
  "name": "Updated Collection Name",
  "description": "Updated description",
  "isPublic": false
}`}
            language="json"
            showCopy={true}
          />

          <h4 className="font-semibold">Example Request</h4>
          <CodeBlock
            code={`curl -X PATCH "https://tpmjs.com/api/collections/my-data-tools" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"name": "Updated Collection Name"}'`}
            language="bash"
            showCopy={true}
          />
        </CardContent>
      </Card>

      {/* Add Tool to Collection */}
      <Card>
        <CardHeader>
          <CardTitle>Add Tool to Collection</CardTitle>
          <CardDescription>POST /api/collections/:uid/tools</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-foreground-secondary">
            Add a tool to a collection. Requires authentication and ownership.
          </p>

          <h4 className="font-semibold">Request Body</h4>
          <CodeBlock
            code={`{
  "toolId": "clx456def"
}`}
            language="json"
            showCopy={true}
          />

          <h4 className="font-semibold">TypeScript Example</h4>
          <CodeBlock
            code={`const response = await fetch('/api/collections/my-data-tools/tools', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_API_KEY'
  },
  body: JSON.stringify({
    toolId: 'clx456def'
  })
});

if (response.ok) {
  console.log('Tool added to collection');
}`}
            language="typescript"
            showCopy={true}
          />
        </CardContent>
      </Card>

      {/* Remove Tool from Collection */}
      <Card>
        <CardHeader>
          <CardTitle>Remove Tool from Collection</CardTitle>
          <CardDescription>DELETE /api/collections/:uid/tools/:toolId</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-foreground-secondary">
            Remove a tool from a collection. Requires authentication and ownership.
          </p>

          <h4 className="font-semibold">Example Request</h4>
          <CodeBlock
            code={`curl -X DELETE "https://tpmjs.com/api/collections/my-data-tools/tools/clx456def" \\
  -H "Authorization: Bearer YOUR_API_KEY"`}
            language="bash"
            showCopy={true}
          />

          <h4 className="font-semibold">Example Response</h4>
          <CodeBlock
            code={`{
  "success": true,
  "message": "Tool removed from collection"
}`}
            language="json"
            showCopy={true}
          />
        </CardContent>
      </Card>

      {/* Like Collection */}
      <Card>
        <CardHeader>
          <CardTitle>Like Collection</CardTitle>
          <CardDescription>POST /api/collections/:uid/like</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-foreground-secondary">
            Like or unlike a collection. Requires authentication.
          </p>

          <h4 className="font-semibold">TypeScript Example</h4>
          <CodeBlock
            code={`// Like a collection
const response = await fetch('/api/collections/web-scraping-toolkit/like', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY'
  }
});

const { data } = await response.json();
console.log('Liked:', data.liked); // true if now liked, false if unliked`}
            language="typescript"
            showCopy={true}
          />
        </CardContent>
      </Card>

      {/* Delete Collection */}
      <Card>
        <CardHeader>
          <CardTitle>Delete Collection</CardTitle>
          <CardDescription>DELETE /api/collections/:uid</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-foreground-secondary">
            Delete a collection. Requires authentication and ownership. This action cannot be
            undone.
          </p>

          <h4 className="font-semibold">Example Request</h4>
          <CodeBlock
            code={`curl -X DELETE "https://tpmjs.com/api/collections/my-data-tools" \\
  -H "Authorization: Bearer YOUR_API_KEY"`}
            language="bash"
            showCopy={true}
          />

          <h4 className="font-semibold">Example Response</h4>
          <CodeBlock
            code={`{
  "success": true,
  "message": "Collection deleted successfully"
}`}
            language="json"
            showCopy={true}
          />
        </CardContent>
      </Card>
    </div>
  );
}
