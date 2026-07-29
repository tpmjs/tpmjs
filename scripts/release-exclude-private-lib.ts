import { isPublishExcluded } from './release-exclusions';

export interface ExcludedManifest {
  name: string;
  path: string;
}

/**
 * From a release audit document, select the packages the CI publish lane must
 * mark `private` so `changeset publish` skips them. A package qualifies only if
 * the audit reclassified it to `excluded` AND it is on the declared exclusion
 * list (defence in depth — the audit and the list must agree before we mutate a
 * manifest). See scripts/release-exclusions.ts (tpmjs/tpmjs#115).
 */
export function excludedManifests(audit: unknown): ExcludedManifest[] {
  if (typeof audit !== 'object' || audit === null) {
    throw new Error('Release audit must be an object');
  }
  const packages = (audit as { packages?: unknown }).packages;
  if (!Array.isArray(packages)) throw new Error('Release audit packages must be an array');

  const manifests: ExcludedManifest[] = [];
  for (const value of packages) {
    if (typeof value !== 'object' || value === null) continue;
    const entry = value as Record<string, unknown>;
    if (entry.state !== 'excluded') continue;
    if (typeof entry.name !== 'string' || typeof entry.path !== 'string') {
      throw new Error('Release audit excluded package is missing a name or path');
    }
    if (!isPublishExcluded(entry.name)) continue;
    manifests.push({ name: entry.name, path: entry.path });
  }
  return manifests;
}
