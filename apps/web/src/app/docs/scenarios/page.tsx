import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@tpmjs/ui/Card/Card';
import { CodeBlock } from '@tpmjs/ui/CodeBlock/CodeBlock';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Scenarios Guide | TPMJS Docs',
  description: 'Test your tool collections with AI-generated scenarios and automated evaluation',
};

export default function ScenariosPage(): React.ReactElement {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-4">Scenarios</h1>
        <p className="text-foreground-secondary text-lg">
          Scenarios are AI-generated test cases for your tool collections. They automatically verify
          that your tools work correctly and provide quality metrics over time.
        </p>
      </div>

      {/* Overview */}
      <Card>
        <CardHeader>
          <CardTitle>What are Scenarios?</CardTitle>
          <CardDescription>Automated testing for tool collections</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-foreground-secondary">
            A Scenario is a test case that exercises your tool collection with a realistic user
            prompt. When you run a scenario:
          </p>
          <ol className="list-decimal list-inside space-y-2 text-foreground-secondary">
            <li>An ephemeral agent is created with your collection&apos;s tools</li>
            <li>The agent executes the scenario&apos;s prompt</li>
            <li>An LLM evaluates whether the task was completed successfully</li>
            <li>Results are recorded and quality scores are updated</li>
          </ol>
          <p className="text-foreground-secondary">
            This enables continuous testing of your tool collections, similar to unit tests for
            code.
          </p>
        </CardContent>
      </Card>

      {/* Use Cases */}
      <Card>
        <CardHeader>
          <CardTitle>Common Archetypes</CardTitle>
          <CardDescription>Typical scenarios for different tool types</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h4 className="font-semibold mb-2">Web Scraping Tools</h4>
            <p className="text-foreground-secondary text-sm mb-2">
              Test data extraction from various webpage structures:
            </p>
            <CodeBlock
              code={`"Scrape the main heading and first paragraph from https://example.com"
"Extract all links from a news article page"
"Get the price and description from an e-commerce product page"`}
              language="text"
              showCopy={false}
            />
          </div>

          <div>
            <h4 className="font-semibold mb-2">Search Tools</h4>
            <p className="text-foreground-secondary text-sm mb-2">
              Verify search accuracy and relevance:
            </p>
            <CodeBlock
              code={`"Search for recent news about climate change and summarize the top 3 results"
"Find documentation for the React useState hook"
"Search for restaurants near Times Square, New York"`}
              language="text"
              showCopy={false}
            />
          </div>

          <div>
            <h4 className="font-semibold mb-2">Data Processing Tools</h4>
            <p className="text-foreground-secondary text-sm mb-2">
              Test transformations and calculations:
            </p>
            <CodeBlock
              code={`"Convert 100 USD to EUR using current exchange rates"
"Parse this JSON and extract the user email addresses"
"Calculate the average of these numbers: 10, 20, 30, 40, 50"`}
              language="text"
              showCopy={false}
            />
          </div>

          <div>
            <h4 className="font-semibold mb-2">File/Document Tools</h4>
            <p className="text-foreground-secondary text-sm mb-2">
              Verify file operations and content extraction:
            </p>
            <CodeBlock
              code={`"Generate a PDF report with the title 'Monthly Summary'"
"Extract text content from a markdown document"
"Create a CSV file with sample user data"`}
              language="text"
              showCopy={false}
            />
          </div>
        </CardContent>
      </Card>

      {/* CLI Installation */}
      <Card>
        <CardHeader>
          <CardTitle>Getting Started</CardTitle>
          <CardDescription>Install the CLI and authenticate</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <h4 className="font-semibold">Install the TPMJS CLI</h4>
          <CodeBlock code="npm install -g @tpmjs/cli" language="bash" showCopy={true} />

          <h4 className="font-semibold">Authenticate</h4>
          <p className="text-foreground-secondary text-sm">
            You need a TPMJS API key to run scenarios. Get one from your{' '}
            <Link
              href="/dashboard/settings/tpmjs-api-keys"
              className="text-primary hover:underline"
            >
              dashboard settings
            </Link>
            .
          </p>
          <CodeBlock code="tpm auth login" language="bash" showCopy={true} />
        </CardContent>
      </Card>

      {/* Generate Scenarios */}
      <Card>
        <CardHeader>
          <CardTitle>Generate Scenarios</CardTitle>
          <CardDescription>tpm scenario generate</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-foreground-secondary">
            AI-generate test scenarios based on your collection&apos;s tools. The generator analyzes
            your tools and creates realistic prompts.
          </p>

          <h4 className="font-semibold">Basic Usage</h4>
          <CodeBlock
            code={`# Generate 1 scenario (default)
tpm scenario generate my-collection

# Generate multiple scenarios
tpm scenario generate my-collection --count 5

# Skip similarity check (allow duplicates)
tpm scenario generate my-collection --count 3 --skip-similarity`}
            language="bash"
            showCopy={true}
          />

          <h4 className="font-semibold">Example Output</h4>
          <CodeBlock
            code={`Generating 3 scenarios for "Web Scraping Toolkit"...

✓ Generated 3 scenarios:

  1. "Scrape the main article content from a news website and extract..."
     Similarity: 0% (unique)
     Tags: web-scraping, content-extraction

  2. "Extract all image URLs from an e-commerce product gallery..."
     Similarity: 15% (unique)
     Tags: web-scraping, images, e-commerce

  3. "Get the current weather data from a weather service page..."
     Similarity: 8% (unique)
     Tags: web-scraping, weather, data-extraction

Use 'tpm scenario list my-collection' to view all scenarios.`}
            language="text"
            showCopy={false}
          />

          <div className="bg-background-secondary p-4 rounded-lg">
            <h4 className="font-semibold text-sm mb-2">Similarity Detection</h4>
            <p className="text-foreground-secondary text-sm">
              Generated scenarios are checked against existing ones using vector similarity. If a
              scenario is &gt;70% similar to an existing one, you&apos;ll see a warning. This helps
              maintain diverse test coverage.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* List Scenarios */}
      <Card>
        <CardHeader>
          <CardTitle>List Scenarios</CardTitle>
          <CardDescription>tpm scenario list</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-foreground-secondary">
            View all scenarios for a collection or browse public scenarios.
          </p>

          <h4 className="font-semibold">Usage</h4>
          <CodeBlock
            code={`# List scenarios for a specific collection
tpm scenario list my-collection

# List all public scenarios
tpm scenario list

# With pagination
tpm scenario list --limit 50 --offset 20

# Filter by tags
tpm scenario list --tags web-scraping,api

# Output as JSON
tpm scenario list my-collection --json`}
            language="bash"
            showCopy={true}
          />

          <h4 className="font-semibold">Example Output</h4>
          <CodeBlock
            code={`Scenarios for Web Scraping Toolkit

Name                                Quality   Runs   Status   Tags
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Scrape main article content...       85%      12     pass     web-scraping
Extract image URLs from gallery      92%       8     pass     images, e-commerce
Get weather data from service...     45%       5     fail     weather, data

Showing 3 scenario(s)`}
            language="text"
            showCopy={false}
          />
        </CardContent>
      </Card>

      {/* Run Scenarios */}
      <Card>
        <CardHeader>
          <CardTitle>Run All Scenarios</CardTitle>
          <CardDescription>tpm scenario run</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-foreground-secondary">
            Execute all scenarios for a collection. This is ideal for CI/CD pipelines or batch
            testing.
          </p>

          <h4 className="font-semibold">Usage</h4>
          <CodeBlock
            code={`# Run all scenarios for a collection
tpm scenario run my-collection

# Verbose output with detailed progress
tpm scenario run my-collection --verbose

# JSON output for CI integration
tpm scenario run my-collection --json`}
            language="bash"
            showCopy={true}
          />

          <h4 className="font-semibold">Example Output</h4>
          <CodeBlock
            code={`Running 3 scenarios for "Web Scraping Toolkit"...

[1/3] Scrape main article content...
      ✓ PASSED (2.3s) - Successfully extracted article content

[2/3] Extract image URLs from gallery
      ✓ PASSED (1.8s) - Found and returned 12 image URLs

[3/3] Get weather data from service...
      ✗ FAILED (3.1s) - Weather service returned 403 error

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Results: 2 passed, 1 failed, 0 errors
Total time: 7.2s
Quota remaining: 47 runs/day`}
            language="text"
            showCopy={false}
          />

          <h4 className="font-semibold">Exit Codes</h4>
          <ul className="list-disc list-inside space-y-1 text-foreground-secondary text-sm">
            <li>
              <code>0</code> - All scenarios passed
            </li>
            <li>
              <code>1</code> - One or more scenarios failed
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Test Single Scenario */}
      <Card>
        <CardHeader>
          <CardTitle>Test Single Scenario</CardTitle>
          <CardDescription>tpm scenario test</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-foreground-secondary">
            Run a single scenario by its ID. Useful for debugging or re-testing specific failures.
          </p>

          <h4 className="font-semibold">Usage</h4>
          <CodeBlock
            code={`# Run a single scenario
tpm scenario test clu123abc456

# With verbose output
tpm scenario test clu123abc456 --verbose

# JSON output
tpm scenario test clu123abc456 --json`}
            language="bash"
            showCopy={true}
          />

          <h4 className="font-semibold">Example Output</h4>
          <CodeBlock
            code={`Scenario: Scrape main article content from a news website
Collection: Web Scraping Toolkit

✓ Scenario PASSED

Results
  Status:    completed
  Verdict:   pass
  Reason:    The agent successfully extracted the main article heading and...

Usage
  Duration:  2,341ms
  Tokens:    1,245 (in: 892, out: 353)

Run ID: run_abc123def456
Quota remaining: 46 runs/day`}
            language="text"
            showCopy={false}
          />
        </CardContent>
      </Card>

      {/* Scenario Info */}
      <Card>
        <CardHeader>
          <CardTitle>View Scenario Details</CardTitle>
          <CardDescription>tpm scenario info</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-foreground-secondary">
            View detailed information about a scenario including its run history and quality
            metrics.
          </p>

          <h4 className="font-semibold">Usage</h4>
          <CodeBlock
            code={`# View scenario details
tpm scenario info clu123abc456

# Include run history
tpm scenario info clu123abc456 --runs 10

# JSON output
tpm scenario info clu123abc456 --json`}
            language="bash"
            showCopy={true}
          />

          <h4 className="font-semibold">Example Output</h4>
          <CodeBlock
            code={`Scenario: Scrape main article content from a news website

ID:           clu123abc456
Collection:   Web Scraping Toolkit
Created:      2 weeks ago

Prompt:
  Scrape the main article content from a news website and extract
  the headline, author, publication date, and body text.

Quality Metrics:
  Score:              85%
  Total Runs:         12
  Consecutive Passes: 5
  Last Run:           2 hours ago (pass)

Tags: web-scraping, content-extraction, news

Recent Runs:
  #12  pass   2h ago    2,341ms   "Successfully extracted article content"
  #11  pass   1d ago    2,156ms   "Successfully extracted article content"
  #10  pass   2d ago    2,892ms   "Successfully extracted article content"
  #9   fail   3d ago    4,521ms   "Timeout waiting for page load"
  #8   pass   4d ago    2,234ms   "Successfully extracted article content"`}
            language="text"
            showCopy={false}
          />
        </CardContent>
      </Card>

      {/* Quality Scoring */}
      <Card>
        <CardHeader>
          <CardTitle>Quality Scoring</CardTitle>
          <CardDescription>How scenario quality is calculated</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-foreground-secondary">
            Quality scores help identify reliable scenarios and track improvement over time. Scores
            range from 0% to 100%.
          </p>

          <h4 className="font-semibold">Streak-Based Scoring</h4>
          <p className="text-foreground-secondary text-sm">
            Scenarios earn bonus points for consecutive passes and lose points for consecutive
            failures:
          </p>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="bg-green-500/10 p-4 rounded-lg">
              <h5 className="font-semibold text-green-600 dark:text-green-400 text-sm mb-2">
                On Pass
              </h5>
              <ul className="text-foreground-secondary text-sm space-y-1">
                <li>+5% base score</li>
                <li>+1% per consecutive pass</li>
                <li>Maximum score: 100%</li>
              </ul>
            </div>
            <div className="bg-red-500/10 p-4 rounded-lg">
              <h5 className="font-semibold text-red-600 dark:text-red-400 text-sm mb-2">
                On Failure
              </h5>
              <ul className="text-foreground-secondary text-sm space-y-1">
                <li>-10% base penalty</li>
                <li>-2% per consecutive fail</li>
                <li>Minimum score: 0%</li>
              </ul>
            </div>
          </div>

          <div className="bg-background-secondary p-4 rounded-lg mt-4">
            <h4 className="font-semibold text-sm mb-2">Example</h4>
            <p className="text-foreground-secondary text-sm">
              A scenario with 5 consecutive passes would have a quality score of approximately 85%
              (5% × 5 + 1% × (1+2+3+4+5) = 25% + 15% = 40%, plus base score). High-quality scenarios
              are featured on the TPMJS homepage showcase.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* CI/CD Integration */}
      <Card>
        <CardHeader>
          <CardTitle>CI/CD Integration</CardTitle>
          <CardDescription>Automate scenario testing in your pipeline</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-foreground-secondary">
            Integrate scenario testing into your CI/CD pipeline to catch regressions early.
          </p>

          <h4 className="font-semibold">GitHub Actions Example</h4>
          <CodeBlock
            code={`name: TPMJS Scenario Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test-scenarios:
    runs-on: ubuntu-latest
    steps:
      - name: Install TPMJS CLI
        run: npm install -g @tpmjs/cli

      - name: Configure API Key
        run: |
          mkdir -p ~/.config/tpmjs
          echo '{"apiKey":"$\{{ secrets.TPMJS_API_KEY }}"}' > ~/.config/tpmjs/config.json

      - name: Run Scenarios
        run: tpm scenario run my-collection --json > results.json

      - name: Check Results
        run: |
          FAILED=$(jq '.failed' results.json)
          if [ "$FAILED" -gt 0 ]; then
            echo "❌ $FAILED scenario(s) failed"
            exit 1
          fi
          echo "✅ All scenarios passed"`}
            language="yaml"
            showCopy={true}
          />

          <h4 className="font-semibold">JSON Output Format</h4>
          <CodeBlock
            code={`{
  "collection": "my-collection",
  "total": 5,
  "passed": 4,
  "failed": 1,
  "errors": 0,
  "duration": 12345,
  "results": [
    {
      "scenarioId": "clu123abc456",
      "name": "Scrape main article content",
      "status": "pass",
      "duration": 2341,
      "verdict": "pass",
      "reason": "Successfully extracted article content"
    }
  ]
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
          <CardDescription>Daily quota and usage tracking</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-foreground-secondary">
            Scenario execution is subject to daily rate limits to ensure fair usage:
          </p>

          <ul className="list-disc list-inside space-y-2 text-foreground-secondary">
            <li>
              <strong>Free tier:</strong> 50 scenario runs per day
            </li>
            <li>
              <strong>Pro tier:</strong> 500 scenario runs per day
            </li>
            <li>Quotas reset at midnight UTC</li>
            <li>Failed runs count toward the quota</li>
          </ul>

          <p className="text-foreground-secondary text-sm mt-4">
            The remaining quota is shown after each scenario run. Plan your CI/CD schedules
            accordingly to stay within limits.
          </p>
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
              <Link href="/docs/api/scenarios" className="text-primary hover:underline font-medium">
                Scenarios API Reference →
              </Link>
              <p className="text-foreground-secondary text-sm">
                REST API endpoints for programmatic scenario management
              </p>
            </li>
            <li>
              <Link
                href="/docs/api/collections"
                className="text-primary hover:underline font-medium"
              >
                Collections API →
              </Link>
              <p className="text-foreground-secondary text-sm">
                Create and manage tool collections for your scenarios
              </p>
            </li>
            <li>
              <Link href="/docs/agents" className="text-primary hover:underline font-medium">
                Agents Documentation →
              </Link>
              <p className="text-foreground-secondary text-sm">
                Learn how scenarios use agents for execution
              </p>
            </li>
            <li>
              <Link href="/" className="text-primary hover:underline font-medium">
                Browse Tool Registry →
              </Link>
              <p className="text-foreground-secondary text-sm">
                Discover tools to add to your collections
              </p>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
