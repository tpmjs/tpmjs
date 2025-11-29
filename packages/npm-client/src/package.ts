/**
 * NPM Package Metadata Client
 * Fetches detailed package information from NPM registry
 */

import { z } from 'zod';

const NPM_REGISTRY_URL = 'https://registry.npmjs.org';

/**
 * Schema for package version metadata
 */
const PackageVersionSchema = z.object({
  name: z.string(),
  version: z.string(),
  description: z.string().optional(),
  keywords: z.array(z.string()).optional(),
  homepage: z.string().optional(),
  repository: z
    .union([
      z.string(),
      z.object({
        type: z.string(),
        url: z.string(),
      }),
    ])
    .optional(),
  license: z.string().optional(),
  author: z
    .union([
      z.string(),
      z.object({
        name: z.string(),
        email: z.string().optional(),
        url: z.string().optional(),
      }),
    ])
    .optional(),
  maintainers: z
    .array(
      z.object({
        name: z.string(),
        email: z.string().optional(),
      })
    )
    .optional(),
  // The tpmjs field - this is what we're looking for!
  tpmjs: z.unknown().optional(),
  // Dist info
  dist: z
    .object({
      shasum: z.string(),
      tarball: z.string(),
    })
    .optional(),
  // Publishing metadata
  publishedAt: z.string().optional(),
});

/**
 * Schema for full package metadata
 */
const PackageMetadataSchema = z.object({
  name: z.string(),
  'dist-tags': z.record(z.string()),
  versions: z.record(PackageVersionSchema),
  time: z.record(z.string()),
  maintainers: z
    .array(
      z.object({
        name: z.string(),
        email: z.string(),
      })
    )
    .optional(),
  description: z.string().optional(),
  homepage: z.string().optional(),
  keywords: z.array(z.string()).optional(),
  repository: z
    .union([
      z.string(),
      z.object({
        type: z.string(),
        url: z.string(),
      }),
    ])
    .optional(),
  license: z.string().optional(),
  readme: z.string().optional(),
});

export type PackageVersion = z.infer<typeof PackageVersionSchema>;
export type PackageMetadata = z.infer<typeof PackageMetadataSchema>;

/**
 * Fetches package metadata from NPM registry
 * @param packageName - The name of the package
 * @returns The package metadata, or null if not found
 */
export async function fetchPackageMetadata(packageName: string): Promise<PackageMetadata | null> {
  // Encode the package name to handle scoped packages (@scope/name)
  const encodedName = packageName.replace('/', '%2F');
  const url = `${NPM_REGISTRY_URL}/${encodedName}`;

  try {
    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
      },
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error(`NPM registry error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return PackageMetadataSchema.parse(data);
  } catch (error) {
    if (error instanceof Error && error.message.includes('404')) {
      return null;
    }
    throw error;
  }
}

/**
 * Gets the latest version of a package
 * @param packageName - The name of the package
 * @returns The latest package version metadata, or null if not found
 */
export async function fetchLatestPackageVersion(
  packageName: string
): Promise<PackageVersion | null> {
  const metadata = await fetchPackageMetadata(packageName);

  if (!metadata) {
    return null;
  }

  const latestTag = metadata['dist-tags'].latest;
  if (!latestTag) {
    return null;
  }

  const version = metadata.versions[latestTag];
  if (!version) {
    return null;
  }

  // Add publishedAt from metadata.time
  const publishedAt = metadata.time?.[latestTag];

  return {
    ...version,
    publishedAt,
  };
}

export type PackageVersionWithReadme = PackageVersion & {
  readme?: string;
  topLevelKeywords?: string[];
  topLevelDescription?: string;
};

/**
 * Gets the latest version of a package with additional top-level metadata
 * @param packageName - The name of the package
 * @returns The latest package version with README and top-level metadata, or null if not found
 */
export async function fetchLatestPackageWithMetadata(
  packageName: string
): Promise<PackageVersionWithReadme | null> {
  const metadata = await fetchPackageMetadata(packageName);

  if (!metadata) {
    return null;
  }

  const latestTag = metadata['dist-tags'].latest;
  if (!latestTag) {
    return null;
  }

  const version = metadata.versions[latestTag];
  if (!version) {
    return null;
  }

  // Add publishedAt from metadata.time
  const publishedAt = metadata.time?.[latestTag];

  return {
    ...version,
    publishedAt,
    readme: metadata.readme,
    topLevelKeywords: metadata.keywords,
    topLevelDescription: metadata.description,
  };
}

/**
 * Checks if a package has a tpmjs field in its latest version
 * @param packageName - The name of the package
 * @returns The tpmjs field if present, null otherwise
 */
export async function fetchPackageTpmjsField(packageName: string): Promise<unknown | null> {
  const latestVersion = await fetchLatestPackageVersion(packageName);

  if (!latestVersion) {
    return null;
  }

  return latestVersion.tpmjs || null;
}
