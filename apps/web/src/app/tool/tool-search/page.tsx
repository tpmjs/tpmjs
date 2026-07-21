import { loadInitialTools } from '~/lib/discovery/server';
import type { DiscoveryTool } from '~/lib/discovery/types';
import { ToolSearchClient } from './ToolSearchClient';

export const dynamic = 'force-dynamic';

interface ToolSearchPageProps {
  searchParams: Promise<{ q?: string | string[] }>;
}

function firstQueryValue(value: string | string[] | undefined): string {
  const query = Array.isArray(value) ? value[0] : value;
  return query?.trim().slice(0, 200) ?? '';
}

function toolUrl(tool: DiscoveryTool): string {
  return `https://tpmjs.com/tool/${tool.package.npmPackageName}/${tool.name}`;
}

export default async function ToolSearchPage({
  searchParams,
}: ToolSearchPageProps): Promise<React.ReactElement> {
  const initialQuery = firstQueryValue((await searchParams).q);
  let initialTools: DiscoveryTool[] = [];
  let initialLoadFailed = false;

  try {
    initialTools = await loadInitialTools(initialQuery);
  } catch (error) {
    initialLoadFailed = true;
    console.error('[Tool Search] Initial server load failed; client retry enabled:', error);
  }

  const itemList = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: initialQuery ? `TPMJS tools matching ${initialQuery}` : 'TPMJS Tool Registry',
    numberOfItems: initialTools.length,
    itemListElement: initialTools.map((tool, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: toolUrl(tool),
      name: tool.name,
      description: tool.description,
    })),
  };

  return (
    <>
      {initialTools.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(itemList).replace(/</g, '\\u003c'),
          }}
        />
      )}
      <ToolSearchClient
        initialTools={initialTools}
        initialQuery={initialQuery}
        initialLoadFailed={initialLoadFailed}
      />
    </>
  );
}
