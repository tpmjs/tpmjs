import { prisma } from '@tpmjs/db';

export interface ExistingToolLifecycle {
  lastSeenVersion: string | null;
  schemaSource: string | null;
}

/** Lifecycle fields for a tool first observed in a package release. */
export function newToolLifecycle(packageVersion: string, now = new Date()) {
  return {
    isActive: true,
    lastSeenVersion: packageVersion,
    retiredAt: null,
    healthCheckNextAt: now,
  } as const;
}

/**
 * Reactivate a returning export and make version-sensitive evidence fresh.
 * An unchanged package poll must not continually discard valid schemas.
 */
export function refreshedToolLifecycle(
  existing: ExistingToolLifecycle | undefined,
  packageVersion: string,
  now = new Date()
) {
  const versionChanged = existing?.lastSeenVersion !== packageVersion;
  const schemaNeedsRefresh = versionChanged && existing?.schemaSource !== 'author';
  return {
    isActive: true,
    lastSeenVersion: packageVersion,
    retiredAt: null,
    ...(schemaNeedsRefresh
      ? {
          schemaSource: null,
          schemaExtractedAt: null,
          schemaExtractionAttemptAt: null,
          schemaExtractionError: null,
        }
      : {}),
    ...(versionChanged
      ? {
          healthCheckNextAt: now,
          healthCheckLeaseUntil: null,
          healthCheckLeasedBy: null,
        }
      : {}),
  } as const;
}

/**
 * Retire exports absent from the observed package version without deleting any
 * historical or user-linked rows. Re-publishing a name later reuses its ID.
 */
export async function retireMissingTools(
  packageId: string,
  observedNames: readonly string[],
  retiredAt = new Date()
): Promise<number> {
  const result = await prisma.tool.updateMany({
    where: {
      packageId,
      isActive: true,
      ...(observedNames.length > 0 ? { name: { notIn: [...observedNames] } } : {}),
    },
    data: {
      isActive: false,
      retiredAt,
      healthCheckLeaseUntil: null,
      healthCheckLeasedBy: null,
    },
  });
  return result.count;
}

/** Queue auto-discovery for a new package version without erasing old exports. */
export async function retireToolsFromOtherVersions(
  packageId: string,
  packageVersion: string,
  retiredAt = new Date()
): Promise<number> {
  const result = await prisma.tool.updateMany({
    where: {
      packageId,
      isActive: true,
      OR: [{ lastSeenVersion: null }, { lastSeenVersion: { not: packageVersion } }],
    },
    data: {
      isActive: false,
      retiredAt,
      healthCheckLeaseUntil: null,
      healthCheckLeasedBy: null,
    },
  });
  return result.count;
}
