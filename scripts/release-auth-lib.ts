export type ReleaseCandidateState = 'publish' | 'new-package';

export interface ReleaseCandidate {
  name: string;
  version: string;
  state: ReleaseCandidateState;
}

export interface OidcEnvironment {
  requestUrl: string;
  requestToken: string;
}

export interface OidcAuthorization {
  name: string;
  version: string;
  expires: string;
}

export interface OidcDenial {
  name: string;
  version: string;
  error: string;
}

export interface OidcAuthorizationReport {
  authorized: OidcAuthorization[];
  denied: OidcDenial[];
}

export interface NpmTrustPublisher {
  repository: string;
  workflow: string;
}

type Fetcher = typeof fetch;

function asRecord(value: unknown, description: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(`${description} must be an object`);
  }
  return value as Record<string, unknown>;
}

function requiredString(record: Record<string, unknown>, key: string, description: string): string {
  const value = record[key];
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`${description}.${key} must be a non-empty string`);
  }
  return value;
}

export function releaseCandidates(audit: unknown): ReleaseCandidate[] {
  const document = asRecord(audit, 'Release audit');
  const summary = asRecord(document.summary, 'Release audit summary');
  if (summary.safe !== true) {
    throw new Error('Release audit is not safe; refusing to authorize publishing');
  }
  if (!Number.isInteger(summary.publishCount) || Number(summary.publishCount) < 0) {
    throw new Error('Release audit summary.publishCount must be a non-negative integer');
  }
  if (!Array.isArray(document.packages)) {
    throw new Error('Release audit packages must be an array');
  }

  const candidates: ReleaseCandidate[] = [];
  for (const [index, value] of document.packages.entries()) {
    const entry = asRecord(value, `Release audit package ${index}`);
    if (entry.safe !== true) {
      throw new Error(`Release audit package ${index} is not safe`);
    }
    if (entry.state !== 'publish' && entry.state !== 'new-package') continue;
    candidates.push({
      name: requiredString(entry, 'name', `Release audit package ${index}`),
      version: requiredString(entry, 'version', `Release audit package ${index}`),
      state: entry.state,
    });
  }

  if (candidates.length !== summary.publishCount) {
    throw new Error(
      `Release audit publish count mismatch: summary=${summary.publishCount}, packages=${candidates.length}`
    );
  }
  return candidates;
}

/**
 * Return the packages the audit deliberately held back from publishing because
 * their npm trusted publisher is not yet registered (audit state `excluded`).
 * These are surfaced as a loud warning; they are never OIDC/publish candidates.
 * See scripts/release-exclusions.ts (tpmjs/tpmjs#115).
 */
export function excludedReleases(audit: unknown): { name: string; version: string }[] {
  const document = asRecord(audit, 'Release audit');
  if (!Array.isArray(document.packages)) return [];
  const excluded: { name: string; version: string }[] = [];
  for (const [index, value] of document.packages.entries()) {
    const entry = asRecord(value, `Release audit package ${index}`);
    if (entry.state !== 'excluded') continue;
    excluded.push({
      name: requiredString(entry, 'name', `Release audit package ${index}`),
      version: requiredString(entry, 'version', `Release audit package ${index}`),
    });
  }
  return excluded;
}

/**
 * Return every public workspace package that already exists on npm.
 *
 * Trusted publishers are configured per package, not per npm scope. Bootstrapping
 * the complete published workspace set once avoids discovering a missing grant
 * only when a future version is already queued for release.
 */
export function publishedPackageNames(audit: unknown): string[] {
  const document = asRecord(audit, 'Release audit');
  const summary = asRecord(document.summary, 'Release audit summary');
  if (summary.safe !== true) {
    throw new Error('Release audit is not safe; refusing to configure npm trust');
  }
  if (!Array.isArray(document.packages)) {
    throw new Error('Release audit packages must be an array');
  }

  const names = new Set<string>();
  for (const [index, value] of document.packages.entries()) {
    const entry = asRecord(value, `Release audit package ${index}`);
    if (entry.safe !== true) {
      throw new Error(`Release audit package ${index} is not safe`);
    }
    const latest = entry.latest;
    if (latest === null) continue;
    if (typeof latest !== 'string' || latest.length === 0) {
      throw new Error(`Release audit package ${index}.latest must be a string or null`);
    }
    names.add(requiredString(entry, 'name', `Release audit package ${index}`));
  }
  return [...names].sort((left, right) => left.localeCompare(right));
}

export function npmTrustGithubArgs(packageName: string, publisher: NpmTrustPublisher): string[] {
  return [
    'trust',
    'github',
    packageName,
    '--file',
    publisher.workflow,
    '--repo',
    publisher.repository,
    '--allow-publish',
  ];
}

export function githubOidcUrl(requestUrl: string): string {
  const url = new URL(requestUrl);
  url.searchParams.set('audience', 'npm:registry.npmjs.org');
  return url.toString();
}

export function npmOidcExchangeUrl(packageName: string): string {
  return `https://registry.npmjs.org/-/npm/v1/oidc/token/exchange/package/${encodeURIComponent(packageName)}`;
}

async function responseMessage(response: Response): Promise<string> {
  try {
    const value: unknown = await response.json();
    const record = asRecord(value, 'Error response');
    for (const key of ['message', 'error']) {
      if (typeof record[key] === 'string') return record[key];
    }
  } catch {
    // The status remains sufficient when a remote endpoint does not return JSON.
  }
  return response.statusText || 'request failed';
}

export async function requestGitHubOidcToken(
  environment: OidcEnvironment,
  fetcher: Fetcher = fetch
): Promise<string> {
  const response = await fetcher(githubOidcUrl(environment.requestUrl), {
    headers: { Authorization: `Bearer ${environment.requestToken}` },
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) {
    throw new Error(
      `GitHub OIDC request failed with HTTP ${response.status}: ${await responseMessage(response)}`
    );
  }
  const document = asRecord(await response.json(), 'GitHub OIDC response');
  return requiredString(document, 'value', 'GitHub OIDC response');
}

export async function authorizeNpmPackage(
  candidate: ReleaseCandidate,
  oidcToken: string,
  fetcher: Fetcher = fetch
): Promise<OidcAuthorization> {
  const response = await fetcher(npmOidcExchangeUrl(candidate.name), {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${oidcToken}`,
    },
    signal: AbortSignal.timeout(15_000),
  });
  if (response.status !== 201) {
    throw new Error(
      `npm trusted publishing rejected ${candidate.name}@${candidate.version} with HTTP ${response.status}: ${await responseMessage(response)}`
    );
  }

  const document = asRecord(await response.json(), 'npm OIDC exchange response');
  requiredString(document, 'token', 'npm OIDC exchange response');
  if (document.token_type !== 'oidc') {
    throw new Error('npm OIDC exchange response.token_type must be oidc');
  }
  return {
    name: candidate.name,
    version: candidate.version,
    expires: requiredString(document, 'expires', 'npm OIDC exchange response'),
  };
}

export async function authorizeNpmPackages(
  candidates: readonly ReleaseCandidate[],
  oidcToken: string,
  fetcher: Fetcher = fetch
): Promise<OidcAuthorizationReport> {
  const report: OidcAuthorizationReport = { authorized: [], denied: [] };
  for (const candidate of candidates) {
    try {
      report.authorized.push(await authorizeNpmPackage(candidate, oidcToken, fetcher));
    } catch (error) {
      report.denied.push({
        name: candidate.name,
        version: candidate.version,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
  return report;
}
