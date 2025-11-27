/**
 * NPM Changes Feed Client
 * Polls the NPM registry changes feed for new package publications
 */

import { z } from 'zod';

const NPM_CHANGES_URL = 'https://replicate.npmjs.com/registry/_changes';

/**
 * Schema for a single change in the feed
 */
const ChangeSchema = z.object({
  id: z.string(),
  seq: z.union([z.string(), z.number()]),
  changes: z.array(z.object({ rev: z.string() })).optional(),
  deleted: z.boolean().optional(),
});

/**
 * Schema for the changes feed response
 */
const ChangesFeedSchema = z.object({
  results: z.array(ChangeSchema),
  last_seq: z.union([z.string(), z.number()]),
  pending: z.number().optional(),
});

export type Change = z.infer<typeof ChangeSchema>;
export type ChangesFeedResponse = z.infer<typeof ChangesFeedSchema>;

export interface FetchChangesOptions {
  /** The sequence number to start from */
  since?: string | number;
  /** Maximum number of changes to fetch */
  limit?: number;
  /** Include document bodies (slower but more data) */
  includeDocs?: boolean;
}

export interface FetchChangesResult {
  results: Change[];
  lastSeq: string;
  pending?: number;
}

/**
 * Fetches changes from the NPM registry
 * @param options - Options for fetching changes
 * @returns The changes and the last sequence number
 */
export async function fetchChanges(options: FetchChangesOptions = {}): Promise<FetchChangesResult> {
  const { since = '0', limit = 100, includeDocs = false } = options;

  const url = new URL(NPM_CHANGES_URL);
  url.searchParams.set('since', String(since));
  url.searchParams.set('limit', String(limit));
  if (includeDocs) {
    url.searchParams.set('include_docs', 'true');
  }

  const response = await fetch(url.toString(), {
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`NPM changes feed error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const parsed = ChangesFeedSchema.parse(data);

  return {
    results: parsed.results.filter((change) => !change.deleted),
    lastSeq: String(parsed.last_seq),
    pending: parsed.pending,
  };
}
