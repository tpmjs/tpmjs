import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@tpmjs/ui/Card/Card';
import { CodeBlock } from '@tpmjs/ui/CodeBlock/CodeBlock';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Scenarios API | TPMJS Docs',
  description: 'API reference for TPMJS scenarios endpoints',
};

export default function ScenariosApiPage(): React.ReactElement {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-4">Scenarios API</h1>
        <p className="text-foreground-secondary text-lg">
          The Scenarios API allows you to create, run, and manage test scenarios for your tool
          collections.
        </p>
      </div>

      {/* List Scenarios */}
      <Card>
        <CardHeader>
          <CardTitle>List Scenarios</CardTitle>
          <CardDescription>GET /api/scenarios</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-foreground-secondary">
            Retrieve a paginated list of public scenarios with optional filtering.
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
              <code>collectionId</code> - Filter by collection ID
            </li>
            <li>
              <code>tags</code> - Filter by tags (comma-separated)
            </li>
            <li>
              <code>sortBy</code> - Sort field: <code>qualityScore</code>, <code>totalRuns</code>,{' '}
              <code>createdAt</code>, <code>lastRunAt</code>
            </li>
          </ul>

          <h4 className="font-semibold">Example Request</h4>
          <CodeBlock
            code={`curl "https://tpmjs.com/api/scenarios?limit=10&sortBy=qualityScore"`}
            language="bash"
            showCopy={true}
          />

          <h4 className="font-semibold">Example Response</h4>
          <CodeBlock
            code={`{
  "data": [
    {
      "id": "clu123abc456",
      "collectionId": "clx789def",
      "prompt": "Scrape the main article content from a news website...",
      "name": "Scrape article content",
      "description": "Tests web scraping capability on news sites",
      "tags": ["web-scraping", "content-extraction"],
      "qualityScore": 0.85,
      "totalRuns": 12,
      "lastRunAt": "2024-01-20T10:30:00Z",
      "lastRunStatus": "pass",
      "consecutivePasses": 5,
      "consecutiveFails": 0,
      "createdAt": "2024-01-01T00:00:00Z",
      "collection": {
        "id": "clx789def",
        "name": "Web Scraping Toolkit",
        "slug": "web-scraping-toolkit",
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

      {/* Get Scenario */}
      <Card>
        <CardHeader>
          <CardTitle>Get Scenario</CardTitle>
          <CardDescription>GET /api/scenarios/:id</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-foreground-secondary">
            Retrieve detailed information about a specific scenario.
          </p>

          <h4 className="font-semibold">Path Parameters</h4>
          <ul className="list-disc list-inside space-y-1 text-foreground-secondary">
            <li>
              <code>id</code> - Scenario ID
            </li>
          </ul>

          <h4 className="font-semibold">Example Request</h4>
          <CodeBlock
            code={`curl "https://tpmjs.com/api/scenarios/clu123abc456"`}
            language="bash"
            showCopy={true}
          />

          <h4 className="font-semibold">Example Response</h4>
          <CodeBlock
            code={`{
  "success": true,
  "data": {
    "id": "clu123abc456",
    "collectionId": "clx789def",
    "prompt": "Scrape the main article content from a news website and extract the headline, author, publication date, and body text.",
    "name": "Scrape article content",
    "description": "Tests web scraping capability on news sites",
    "tags": ["web-scraping", "content-extraction", "news"],
    "assertions": null,
    "qualityScore": 0.85,
    "totalRuns": 12,
    "lastRunAt": "2024-01-20T10:30:00Z",
    "lastRunStatus": "pass",
    "consecutivePasses": 5,
    "consecutiveFails": 0,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-20T10:30:00Z",
    "collection": {
      "id": "clx789def",
      "name": "Web Scraping Toolkit",
      "slug": "web-scraping-toolkit"
    }
  }
}`}
            language="json"
            showCopy={true}
          />
        </CardContent>
      </Card>

      {/* List Collection Scenarios */}
      <Card>
        <CardHeader>
          <CardTitle>List Collection Scenarios</CardTitle>
          <CardDescription>GET /api/collections/:id/scenarios</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-foreground-secondary">
            Retrieve all scenarios for a specific collection.
          </p>

          <h4 className="font-semibold">Path Parameters</h4>
          <ul className="list-disc list-inside space-y-1 text-foreground-secondary">
            <li>
              <code>id</code> - Collection ID
            </li>
          </ul>

          <h4 className="font-semibold">Query Parameters</h4>
          <ul className="list-disc list-inside space-y-1 text-foreground-secondary">
            <li>
              <code>limit</code> - Number of results (default: 20, max: 50)
            </li>
            <li>
              <code>offset</code> - Pagination offset
            </li>
          </ul>

          <h4 className="font-semibold">Example Request</h4>
          <CodeBlock
            code={`curl "https://tpmjs.com/api/collections/clx789def/scenarios"`}
            language="bash"
            showCopy={true}
          />

          <h4 className="font-semibold">Example Response</h4>
          <CodeBlock
            code={`{
  "success": true,
  "data": {
    "scenarios": [
      {
        "id": "clu123abc456",
        "name": "Scrape article content",
        "prompt": "Scrape the main article content...",
        "qualityScore": 0.85,
        "totalRuns": 12,
        "lastRunStatus": "pass",
        "tags": ["web-scraping"]
      }
    ]
  }
}`}
            language="json"
            showCopy={true}
          />
        </CardContent>
      </Card>

      {/* Create Scenario */}
      <Card>
        <CardHeader>
          <CardTitle>Create Scenario</CardTitle>
          <CardDescription>POST /api/scenarios</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-foreground-secondary">
            Create a new scenario manually. Requires authentication and collection ownership.
          </p>

          <h4 className="font-semibold">Request Body</h4>
          <CodeBlock
            code={`{
  "collectionId": "clx789def",
  "prompt": "Search for weather information in Tokyo and return the current temperature",
  "name": "Tokyo weather lookup",
  "description": "Tests weather search functionality",
  "tags": ["weather", "search", "api"]
}`}
            language="json"
            showCopy={true}
          />

          <h4 className="font-semibold">TypeScript Example</h4>
          <CodeBlock
            code={`const response = await fetch('https://tpmjs.com/api/scenarios', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_API_KEY'
  },
  body: JSON.stringify({
    collectionId: 'clx789def',
    prompt: 'Search for weather information in Tokyo',
    name: 'Tokyo weather lookup',
    tags: ['weather', 'search']
  })
});

const { data: scenario } = await response.json();
console.log('Created scenario:', scenario.id);`}
            language="typescript"
            showCopy={true}
          />
        </CardContent>
      </Card>

      {/* Generate Scenarios */}
      <Card>
        <CardHeader>
          <CardTitle>Generate Scenarios</CardTitle>
          <CardDescription>POST /api/collections/:id/scenarios/generate</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-foreground-secondary">
            AI-generate scenarios based on the collection&apos;s tools. Requires authentication and
            collection ownership.
          </p>

          <h4 className="font-semibold">Path Parameters</h4>
          <ul className="list-disc list-inside space-y-1 text-foreground-secondary">
            <li>
              <code>id</code> - Collection ID
            </li>
          </ul>

          <h4 className="font-semibold">Request Body</h4>
          <CodeBlock
            code={`{
  "count": 3,
  "skipSimilarityCheck": false
}`}
            language="json"
            showCopy={true}
          />

          <h4 className="font-semibold">Example Request</h4>
          <CodeBlock
            code={`curl -X POST "https://tpmjs.com/api/collections/clx789def/scenarios/generate" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"count": 3}'`}
            language="bash"
            showCopy={true}
          />

          <h4 className="font-semibold">Example Response</h4>
          <CodeBlock
            code={`{
  "success": true,
  "data": {
    "scenarios": [
      {
        "scenario": {
          "id": "clu111aaa",
          "prompt": "Scrape the main article content from a news website...",
          "name": "News article extraction",
          "tags": ["web-scraping", "content-extraction"]
        },
        "similarity": {
          "maxSimilarity": 0.15,
          "mostSimilar": null
        }
      },
      {
        "scenario": {
          "id": "clu222bbb",
          "prompt": "Extract all product images from an e-commerce page...",
          "name": "E-commerce image extraction",
          "tags": ["web-scraping", "images", "e-commerce"]
        },
        "similarity": {
          "maxSimilarity": 0.72,
          "mostSimilar": {
            "id": "clu000xxx",
            "name": "Product page scraping"
          }
        }
      }
    ]
  }
}`}
            language="json"
            showCopy={true}
          />

          <div className="bg-background-secondary p-4 rounded-lg">
            <h4 className="font-semibold text-sm mb-2">Similarity Warning</h4>
            <p className="text-foreground-secondary text-sm">
              When <code>similarity.maxSimilarity</code> exceeds 0.7, the scenario is similar to an
              existing one. The <code>mostSimilar</code> field shows which scenario it overlaps
              with.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Run Scenario */}
      <Card>
        <CardHeader>
          <CardTitle>Run Scenario</CardTitle>
          <CardDescription>POST /api/scenarios/:id/run</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-foreground-secondary">
            Execute a scenario and return the results. Requires authentication. Consumes one run
            from your daily quota.
          </p>

          <h4 className="font-semibold">Path Parameters</h4>
          <ul className="list-disc list-inside space-y-1 text-foreground-secondary">
            <li>
              <code>id</code> - Scenario ID
            </li>
          </ul>

          <h4 className="font-semibold">Example Request</h4>
          <CodeBlock
            code={`curl -X POST "https://tpmjs.com/api/scenarios/clu123abc456/run" \\
  -H "Authorization: Bearer YOUR_API_KEY"`}
            language="bash"
            showCopy={true}
          />

          <h4 className="font-semibold">Example Response</h4>
          <CodeBlock
            code={`{
  "success": true,
  "data": {
    "runId": "run_abc123def456",
    "status": "completed",
    "success": true,
    "evaluator": {
      "model": "claude-3-5-sonnet-latest",
      "verdict": "pass",
      "reason": "The agent successfully extracted the article headline, author name, publication date, and full body text from the news website. All required fields were present and correctly formatted."
    },
    "usage": {
      "inputTokens": 892,
      "outputTokens": 353,
      "totalTokens": 1245,
      "executionTimeMs": 2341
    },
    "timestamps": {
      "startedAt": "2024-01-20T10:30:00Z",
      "completedAt": "2024-01-20T10:30:02Z",
      "createdAt": "2024-01-20T10:30:00Z"
    },
    "quotaRemaining": 46
  }
}`}
            language="json"
            showCopy={true}
          />

          <h4 className="font-semibold">Failure Response</h4>
          <CodeBlock
            code={`{
  "success": true,
  "data": {
    "runId": "run_xyz789",
    "status": "completed",
    "success": false,
    "evaluator": {
      "model": "claude-3-5-sonnet-latest",
      "verdict": "fail",
      "reason": "The agent was unable to complete the task. The target website returned a 403 Forbidden error, preventing the scraping operation."
    },
    "usage": {
      "inputTokens": 456,
      "outputTokens": 123,
      "totalTokens": 579,
      "executionTimeMs": 3102
    },
    "quotaRemaining": 45
  }
}`}
            language="json"
            showCopy={true}
          />
        </CardContent>
      </Card>

      {/* Get Scenario Runs */}
      <Card>
        <CardHeader>
          <CardTitle>Get Scenario Run History</CardTitle>
          <CardDescription>GET /api/scenarios/:id/runs</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-foreground-secondary">
            Retrieve the run history for a scenario. Requires authentication if the scenario belongs
            to a private collection.
          </p>

          <h4 className="font-semibold">Path Parameters</h4>
          <ul className="list-disc list-inside space-y-1 text-foreground-secondary">
            <li>
              <code>id</code> - Scenario ID
            </li>
          </ul>

          <h4 className="font-semibold">Query Parameters</h4>
          <ul className="list-disc list-inside space-y-1 text-foreground-secondary">
            <li>
              <code>limit</code> - Number of results (default: 10, max: 50)
            </li>
            <li>
              <code>offset</code> - Pagination offset
            </li>
          </ul>

          <h4 className="font-semibold">Example Request</h4>
          <CodeBlock
            code={`curl "https://tpmjs.com/api/scenarios/clu123abc456/runs?limit=5" \\
  -H "Authorization: Bearer YOUR_API_KEY"`}
            language="bash"
            showCopy={true}
          />

          <h4 className="font-semibold">Example Response</h4>
          <CodeBlock
            code={`{
  "data": [
    {
      "id": "run_abc123",
      "status": "completed",
      "success": true,
      "evaluator": {
        "model": "claude-3-5-sonnet-latest",
        "verdict": "pass",
        "reason": "Successfully extracted article content"
      },
      "assertions": null,
      "usage": {
        "inputTokens": 892,
        "outputTokens": 353,
        "totalTokens": 1245,
        "executionTimeMs": 2341
      },
      "timestamps": {
        "startedAt": "2024-01-20T10:30:00Z",
        "completedAt": "2024-01-20T10:30:02Z",
        "createdAt": "2024-01-20T10:30:00Z"
      }
    }
  ],
  "pagination": {
    "limit": 5,
    "offset": 0,
    "hasMore": true
  }
}`}
            language="json"
            showCopy={true}
          />
        </CardContent>
      </Card>

      {/* Check Similarity */}
      <Card>
        <CardHeader>
          <CardTitle>Check Prompt Similarity</CardTitle>
          <CardDescription>POST /api/scenarios/check-similarity</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-foreground-secondary">
            Check if a prompt is similar to existing scenarios in a collection. Useful before
            creating manual scenarios to avoid duplicates.
          </p>

          <h4 className="font-semibold">Request Body</h4>
          <CodeBlock
            code={`{
  "prompt": "Scrape article headlines from a news website",
  "collectionId": "clx789def"
}`}
            language="json"
            showCopy={true}
          />

          <h4 className="font-semibold">Example Response</h4>
          <CodeBlock
            code={`{
  "success": true,
  "data": {
    "maxSimilarity": 0.78,
    "similar": [
      {
        "id": "clu123abc456",
        "name": "Scrape article content",
        "prompt": "Scrape the main article content from a news website...",
        "similarity": 0.78
      },
      {
        "id": "clu789xyz",
        "name": "Extract news headlines",
        "prompt": "Get all headlines from the front page of a news site...",
        "similarity": 0.65
      }
    ]
  }
}`}
            language="json"
            showCopy={true}
          />

          <div className="bg-background-secondary p-4 rounded-lg">
            <h4 className="font-semibold text-sm mb-2">Similarity Threshold</h4>
            <p className="text-foreground-secondary text-sm">
              A <code>maxSimilarity</code> above 0.7 indicates significant overlap with existing
              scenarios. Consider modifying your prompt to test different aspects of your tools.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Featured Scenarios */}
      <Card>
        <CardHeader>
          <CardTitle>Get Featured Scenarios</CardTitle>
          <CardDescription>GET /api/scenarios/featured</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-foreground-secondary">
            Retrieve featured scenarios for the homepage showcase. Returns a mix of high-quality,
            diverse, and recently successful scenarios.
          </p>

          <h4 className="font-semibold">Query Parameters</h4>
          <ul className="list-disc list-inside space-y-1 text-foreground-secondary">
            <li>
              <code>limit</code> - Number of results (default: 10, max: 20)
            </li>
          </ul>

          <h4 className="font-semibold">Example Request</h4>
          <CodeBlock
            code={`curl "https://tpmjs.com/api/scenarios/featured?limit=5"`}
            language="bash"
            showCopy={true}
          />

          <h4 className="font-semibold">Example Response</h4>
          <CodeBlock
            code={`{
  "success": true,
  "data": [
    {
      "id": "clu123abc456",
      "name": "Scrape article content",
      "qualityScore": 0.95,
      "totalRuns": 50,
      "lastRunStatus": "pass",
      "collection": {
        "name": "Web Scraping Toolkit",
        "slug": "web-scraping-toolkit",
        "username": "johndoe"
      }
    }
  ]
}`}
            language="json"
            showCopy={true}
          />
        </CardContent>
      </Card>

      {/* Error Responses */}
      <Card>
        <CardHeader>
          <CardTitle>Error Responses</CardTitle>
          <CardDescription>Common error codes and responses</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <h4 className="font-semibold">401 Unauthorized</h4>
          <CodeBlock
            code={`{
  "success": false,
  "error": "Unauthorized",
  "message": "API key is required for this endpoint"
}`}
            language="json"
            showCopy={true}
          />

          <h4 className="font-semibold">403 Forbidden</h4>
          <CodeBlock
            code={`{
  "success": false,
  "error": "Forbidden",
  "message": "You don't have permission to access this scenario"
}`}
            language="json"
            showCopy={true}
          />

          <h4 className="font-semibold">404 Not Found</h4>
          <CodeBlock
            code={`{
  "success": false,
  "error": "Not Found",
  "message": "Scenario not found"
}`}
            language="json"
            showCopy={true}
          />

          <h4 className="font-semibold">429 Rate Limited</h4>
          <CodeBlock
            code={`{
  "success": false,
  "error": "Rate Limit Exceeded",
  "message": "Daily scenario run quota exceeded. Resets at midnight UTC.",
  "quotaRemaining": 0,
  "resetAt": "2024-01-21T00:00:00Z"
}`}
            language="json"
            showCopy={true}
          />
        </CardContent>
      </Card>
    </div>
  );
}
