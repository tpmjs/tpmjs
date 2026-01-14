import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@tpmjs/ui/Card/Card';
import { CodeBlock } from '@tpmjs/ui/CodeBlock/CodeBlock';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Authentication | TPMJS Docs',
  description: 'Authentication guide for the TPMJS API',
};

export default function AuthenticationPage(): React.ReactElement {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-4">Authentication</h1>
        <p className="text-foreground-secondary text-lg">
          Learn how to authenticate with the TPMJS API to access protected endpoints.
        </p>
      </div>

      {/* Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Overview</CardTitle>
          <CardDescription>Understanding TPMJS authentication</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-foreground-secondary">
            TPMJS uses API keys for authentication. Some endpoints are public and don&apos;t require
            authentication, while others require a valid API key to access.
          </p>

          <h4 className="font-semibold">Public Endpoints (No Auth Required)</h4>
          <ul className="list-disc list-inside space-y-1 text-foreground-secondary">
            <li>
              <code>GET /api/tools</code> - List and search tools
            </li>
            <li>
              <code>GET /api/tools/:id</code> - Get tool details
            </li>
            <li>
              <code>GET /api/tools/trending</code> - Get trending tools
            </li>
            <li>
              <code>GET /api/collections</code> - List public collections
            </li>
            <li>
              <code>GET /api/collections/:uid</code> - Get collection details
            </li>
          </ul>

          <h4 className="font-semibold">Protected Endpoints (Auth Required)</h4>
          <ul className="list-disc list-inside space-y-1 text-foreground-secondary">
            <li>
              <code>POST /api/tools/:id/rate</code> - Rate a tool
            </li>
            <li>
              <code>POST /api/tools/:id/reviews</code> - Write a review
            </li>
            <li>
              <code>POST /api/collections</code> - Create a collection
            </li>
            <li>
              <code>POST /api/agents</code> - Create an agent
            </li>
            <li>
              <code>GET /api/agents</code> - List your agents
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Getting an API Key */}
      <Card>
        <CardHeader>
          <CardTitle>Getting an API Key</CardTitle>
          <CardDescription>How to obtain your API key</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-foreground-secondary">
            To get an API key, you need to create a TPMJS account and generate a key from your
            dashboard.
          </p>

          <ol className="list-decimal list-inside space-y-2 text-foreground-secondary">
            <li>Sign up or log in at tpmjs.com</li>
            <li>Navigate to Settings → API Keys</li>
            <li>Click &quot;Generate New Key&quot;</li>
            <li>Copy your key and store it securely</li>
          </ol>

          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
            <p className="text-amber-600 dark:text-amber-400 font-medium">Important</p>
            <p className="text-foreground-secondary text-sm mt-1">
              Your API key is displayed only once when created. Make sure to copy and store it
              securely. If you lose it, you&apos;ll need to generate a new one.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Using Your API Key */}
      <Card>
        <CardHeader>
          <CardTitle>Using Your API Key</CardTitle>
          <CardDescription>How to authenticate requests</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-foreground-secondary">
            Include your API key in the <code>Authorization</code> header using the Bearer scheme.
          </p>

          <h4 className="font-semibold">Header Format</h4>
          <CodeBlock code={`Authorization: Bearer YOUR_API_KEY`} language="text" showCopy={true} />

          <h4 className="font-semibold">cURL Example</h4>
          <CodeBlock
            code={`curl -H "Authorization: Bearer YOUR_API_KEY" \\
  "https://tpmjs.com/api/agents"`}
            language="bash"
            showCopy={true}
          />

          <h4 className="font-semibold">JavaScript/TypeScript Example</h4>
          <CodeBlock
            code={`const API_KEY = process.env.TPMJS_API_KEY;

const response = await fetch('https://tpmjs.com/api/agents', {
  headers: {
    'Authorization': \`Bearer \${API_KEY}\`,
    'Content-Type': 'application/json'
  }
});

const data = await response.json();`}
            language="typescript"
            showCopy={true}
          />

          <h4 className="font-semibold">Python Example</h4>
          <CodeBlock
            code={`import os
import requests

API_KEY = os.environ.get('TPMJS_API_KEY')

response = requests.get(
    'https://tpmjs.com/api/agents',
    headers={
        'Authorization': f'Bearer {API_KEY}',
        'Content-Type': 'application/json'
    }
)

data = response.json()`}
            language="python"
            showCopy={true}
          />
        </CardContent>
      </Card>

      {/* Error Responses */}
      <Card>
        <CardHeader>
          <CardTitle>Authentication Errors</CardTitle>
          <CardDescription>Common authentication error responses</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <h4 className="font-semibold">401 Unauthorized</h4>
          <p className="text-foreground-secondary text-sm mb-2">
            Returned when no API key is provided or the key is invalid.
          </p>
          <CodeBlock
            code={`{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required. Please provide a valid API key."
  }
}`}
            language="json"
            showCopy={true}
          />

          <h4 className="font-semibold">403 Forbidden</h4>
          <p className="text-foreground-secondary text-sm mb-2">
            Returned when the API key is valid but lacks permission for the requested action.
          </p>
          <CodeBlock
            code={`{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "You don't have permission to access this resource."
  }
}`}
            language="json"
            showCopy={true}
          />

          <h4 className="font-semibold">429 Rate Limited</h4>
          <p className="text-foreground-secondary text-sm mb-2">
            Returned when you&apos;ve exceeded the rate limit for your API key.
          </p>
          <CodeBlock
            code={`{
  "success": false,
  "error": {
    "code": "RATE_LIMITED",
    "message": "Too many requests. Please try again in 60 seconds."
  }
}`}
            language="json"
            showCopy={true}
          />
        </CardContent>
      </Card>

      {/* Rate Limits */}
      <Card>
        <CardHeader>
          <CardTitle>Rate Limits</CardTitle>
          <CardDescription>API request limits</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-foreground-secondary">
            TPMJS enforces rate limits to ensure fair usage and protect the API from abuse.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 pr-4">Tier</th>
                  <th className="text-left py-2 pr-4">Requests/min</th>
                  <th className="text-left py-2">Requests/day</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-2 pr-4">Free</td>
                  <td className="py-2 pr-4">60</td>
                  <td className="py-2">1,000</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 pr-4">Pro</td>
                  <td className="py-2 pr-4">300</td>
                  <td className="py-2">10,000</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">Enterprise</td>
                  <td className="py-2 pr-4">Custom</td>
                  <td className="py-2">Custom</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h4 className="font-semibold">Rate Limit Headers</h4>
          <p className="text-foreground-secondary text-sm mb-2">
            Every response includes rate limit information in headers:
          </p>
          <CodeBlock
            code={`X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1704067200`}
            language="text"
            showCopy={true}
          />
        </CardContent>
      </Card>

      {/* Best Practices */}
      <Card>
        <CardHeader>
          <CardTitle>Security Best Practices</CardTitle>
          <CardDescription>Keep your API key secure</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="list-disc list-inside space-y-2 text-foreground-secondary">
            <li>
              <strong>Never commit API keys to version control.</strong> Use environment variables
              instead.
            </li>
            <li>
              <strong>Rotate keys regularly.</strong> Generate new keys periodically and revoke old
              ones.
            </li>
            <li>
              <strong>Use separate keys for development and production.</strong> This limits the
              impact if a key is compromised.
            </li>
            <li>
              <strong>Monitor usage.</strong> Check your API usage in the dashboard to detect
              unusual activity.
            </li>
            <li>
              <strong>Revoke compromised keys immediately.</strong> If you suspect a key has been
              exposed, revoke it and generate a new one.
            </li>
          </ul>

          <h4 className="font-semibold">Environment Variables Example</h4>
          <CodeBlock
            code={`# .env.local (add to .gitignore)
TPMJS_API_KEY=your_api_key_here

# In your code
const apiKey = process.env.TPMJS_API_KEY;`}
            language="bash"
            showCopy={true}
          />
        </CardContent>
      </Card>
    </div>
  );
}
