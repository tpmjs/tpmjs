'use client';

import { Badge } from '@tpmjs/ui/Badge/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@tpmjs/ui/Card/Card';

// Hardcoded list of installed tools
const INSTALLED_TOOLS = [
  {
    name: 'hello-world',
    description: 'Returns a simple "Hello, World!" greeting',
    category: 'text-analysis',
  },
  {
    name: 'hello-name',
    description: 'Returns a personalized greeting with a name',
    category: 'text-analysis',
  },
  {
    name: 'firecrawl (scrape)',
    description: 'Scrape content from any URL',
    category: 'web-scraping',
  },
  {
    name: 'firecrawl (crawl)',
    description: 'Crawl entire websites recursively',
    category: 'web-scraping',
  },
  {
    name: 'firecrawl (search)',
    description: 'Search the web for content',
    category: 'web-scraping',
  },
];

export function ToolsSidebar(): React.ReactElement {
  return (
    <aside className="hidden w-64 border-r border-border bg-surface md:block">
      <div className="p-4">
        <h2 className="mb-4 text-lg font-bold">
          Available Tools <Badge variant="secondary">{INSTALLED_TOOLS.length}</Badge>
        </h2>

        <div className="space-y-2">
          {INSTALLED_TOOLS.map((tool) => (
            <Card key={tool.name} variant="outline" className="cursor-pointer hover:bg-background">
              <CardHeader>
                <CardTitle className="text-sm">{tool.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-foreground-secondary">{tool.description}</p>
                <div className="mt-2">
                  <Badge variant="secondary" size="sm">
                    {tool.category}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </aside>
  );
}
