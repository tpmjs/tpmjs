export interface WorkspacePackage {
  name: string;
  version: string;
  path: string;
  private: boolean;
}

export interface RegistryPackage {
  latest: string | null;
  versions: ReadonlySet<string>;
}

export type ReleaseState =
  | 'current'
  | 'published-not-latest'
  | 'publish'
  | 'new-package'
  | 'behind'
  | 'unproven-release'
  // A package that WOULD publish but is deliberately held back because its npm
  // trusted publisher is not yet registered. Safe, never a publish candidate.
  // See scripts/release-exclusions.ts (tpmjs/tpmjs#115).
  | 'excluded';

export interface ReleaseAuditEntry extends WorkspacePackage {
  latest: string | null;
  state: ReleaseState;
  safe: boolean;
  reason: string;
}

interface SemVer {
  major: number;
  minor: number;
  patch: number;
  prerelease: readonly string[];
}

const SEMVER_PATTERN =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;

export function parseSemVer(version: string): SemVer {
  const match = SEMVER_PATTERN.exec(version);
  if (!match) {
    throw new Error(`Invalid semantic version: ${version}`);
  }

  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    prerelease: match[4]?.split('.') ?? [],
  };
}

function comparePrereleaseIdentifier(left: string, right: string): number {
  const leftNumeric = /^\d+$/.test(left);
  const rightNumeric = /^\d+$/.test(right);
  if (leftNumeric && rightNumeric) return Number(left) < Number(right) ? -1 : 1;
  if (leftNumeric) return -1;
  if (rightNumeric) return 1;
  return left < right ? -1 : 1;
}

function comparePrerelease(left: readonly string[], right: readonly string[]): number {
  if (left.length === 0 || right.length === 0) {
    return left.length === right.length ? 0 : left.length === 0 ? 1 : -1;
  }

  const length = Math.min(left.length, right.length);
  for (let index = 0; index < length; index += 1) {
    const leftPart = left[index];
    const rightPart = right[index];
    if (leftPart === rightPart) continue;
    return comparePrereleaseIdentifier(leftPart, rightPart);
  }

  return left.length === right.length ? 0 : left.length < right.length ? -1 : 1;
}

export function compareSemVer(leftVersion: string, rightVersion: string): number {
  const left = parseSemVer(leftVersion);
  const right = parseSemVer(rightVersion);

  for (const key of ['major', 'minor', 'patch'] as const) {
    if (left[key] !== right[key]) return left[key] < right[key] ? -1 : 1;
  }

  return comparePrerelease(left.prerelease, right.prerelease);
}

export function hasChangelogRelease(changelog: string | null, version: string): boolean {
  if (changelog === null) return false;
  return changelog.split('\n').some((line) => line.trim() === `## ${version}`);
}

/**
 * Classify a workspace package against npm, then apply the publish exclusion.
 *
 * @param excluded  When true and the package would otherwise publish, it is
 *   reclassified to the safe `excluded` state instead of `publish`/`new-package`
 *   so it never becomes a publish/OIDC/build candidate. The caller decides which
 *   packages are excluded (see scripts/release-exclusions.ts) — this library
 *   stays free of the concrete list so it remains pure and unit-testable.
 */
export function classifyRelease(
  workspace: WorkspacePackage,
  registry: RegistryPackage | null,
  changelog: string | null,
  excluded = false
): ReleaseAuditEntry {
  const entry = classifyPublishableRelease(workspace, registry, changelog);
  if (!excluded || (entry.state !== 'publish' && entry.state !== 'new-package')) {
    return entry;
  }
  return {
    ...entry,
    state: 'excluded',
    safe: true,
    reason: `${entry.reason} Held back: npm trusted publisher not registered, so this version is excluded from the release. See scripts/release-exclusions.ts (tpmjs/tpmjs#115).`,
  };
}

function classifyPublishableRelease(
  workspace: WorkspacePackage,
  registry: RegistryPackage | null,
  changelog: string | null
): ReleaseAuditEntry {
  if (registry === null) {
    const proven = hasChangelogRelease(changelog, workspace.version);
    return {
      ...workspace,
      latest: null,
      state: proven ? 'new-package' : 'unproven-release',
      safe: proven,
      reason: proven
        ? 'Package is new to npm and its changelog records this version.'
        : 'Package is new to npm but has no matching changelog release entry.',
    };
  }

  if (registry.versions.has(workspace.version)) {
    if (registry.latest === workspace.version) {
      return {
        ...workspace,
        latest: registry.latest,
        state: 'current',
        safe: true,
        reason: 'Source version is already the npm latest version.',
      };
    }

    if (registry.latest !== null && compareSemVer(workspace.version, registry.latest) < 0) {
      return {
        ...workspace,
        latest: registry.latest,
        state: 'behind',
        safe: false,
        reason: 'Source version is older than npm latest.',
      };
    }

    return {
      ...workspace,
      latest: registry.latest,
      state: 'published-not-latest',
      safe: true,
      reason: 'Source version exists on npm but is not tagged latest; nothing would publish.',
    };
  }

  if (registry.latest !== null && compareSemVer(workspace.version, registry.latest) < 0) {
    return {
      ...workspace,
      latest: registry.latest,
      state: 'behind',
      safe: false,
      reason: 'Source version is older than npm latest and does not exist on npm.',
    };
  }

  const proven = hasChangelogRelease(changelog, workspace.version);
  return {
    ...workspace,
    latest: registry.latest,
    state: proven ? 'publish' : 'unproven-release',
    safe: proven,
    reason: proven
      ? 'Source version is unpublished and its changelog records this version.'
      : 'Source version is unpublished but has no matching changelog release entry.',
  };
}

export function summarizeAudit(entries: readonly ReleaseAuditEntry[]) {
  const counts = new Map<ReleaseState, number>();
  for (const entry of entries) {
    counts.set(entry.state, (counts.get(entry.state) ?? 0) + 1);
  }

  return {
    total: entries.length,
    safe: entries.every((entry) => entry.safe),
    publishCount: entries.filter(
      (entry) => entry.state === 'publish' || entry.state === 'new-package'
    ).length,
    counts: Object.fromEntries(
      [...counts.entries()].sort(([left], [right]) => left.localeCompare(right))
    ),
  };
}
