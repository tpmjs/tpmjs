/**
 * Packages that must NOT publish to npm yet because their npm trusted-publisher
 * (OIDC) grant has not been registered.
 *
 * Registering a trusted publisher is a user-gated, interactive maintainer action
 * (`npm login --auth-type=web` + 2FA); CI cannot self-serve it. Until it is done,
 * npm rejects the package's OIDC token exchange with HTTP 404 ("package not
 * found").
 *
 * WHY THIS LIST EXISTS (the bug it fixes):
 * The release preflight (`scripts/release-auth.ts`) requests an OIDC token
 * exchange for every publishable package and *fails closed* on any rejection.
 * Before this list, one ungranted package (`@tpmjs/tools-unsandbox`) failed the
 * whole preflight and froze the ENTIRE monorepo release — every other package's
 * queued changesets were blocked with it. Per-package fail-closed is correct; a
 * WHOLE-monorepo fail-closed on one known user-gated package is the defect.
 *
 * Excluding a package here keeps per-package fail-closed behaviour (the package
 * still does not publish) while letting the rest of the monorepo release. The
 * exclusion is enforced in three coordinated places, ALL reading this one list:
 *   1. the release audit (`scripts/release-audit.ts`) reclassifies the package
 *      to the `excluded` state, so it is never a publish/OIDC/build candidate;
 *   2. the preflight (`scripts/release-auth.ts`) surfaces a loud warning; and
 *   3. the CI publish lane (`scripts/release-exclude-private.ts`, wired into the
 *      `changeset:publish:ci` script) marks the package `private` in the
 *      ephemeral CI checkout so `changeset publish` skips it. `changeset publish`
 *      honours ONLY `private` — it ignores the changesets `ignore` config — so
 *      marking private is the one reliable lever, and it is never committed.
 *
 * TO REMOVE AN ENTRY (the user-gated reconcile): a maintainer registers the
 * trusted publisher once, e.g.
 *   npm trust github @tpmjs/tools-unsandbox --file release.yml --repo tpmjs/tpmjs --allow-publish
 * then deletes the entry below. On the next push the package publishes normally
 * (its source version is already ahead of npm).
 *
 * Tracking issue: https://github.com/tpmjs/tpmjs/issues/115
 */
export interface PublishExclusion {
  /** Exact npm package name. */
  readonly name: string;
  /** Why it is gated — shown in release evidence and warnings. */
  readonly reason: string;
  /** Where its removal is tracked. */
  readonly issue: string;
}

export const PUBLISH_EXCLUSIONS: readonly PublishExclusion[] = [
  {
    name: '@tpmjs/tools-unsandbox',
    reason:
      'npm trusted publisher (OIDC) not yet registered; registering it is a user-gated maintainer action.',
    issue: 'https://github.com/tpmjs/tpmjs/issues/115',
  },
];

const EXCLUDED_NAMES = new Set(PUBLISH_EXCLUSIONS.map((entry) => entry.name));

export function isPublishExcluded(name: string): boolean {
  return EXCLUDED_NAMES.has(name);
}

export function publishExclusion(name: string): PublishExclusion | undefined {
  return PUBLISH_EXCLUSIONS.find((entry) => entry.name === name);
}
