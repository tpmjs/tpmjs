import fs from 'node:fs';
import path from 'node:path';
import { AppFooter } from '../../components/AppFooter';
import { AppHeader } from '../../components/AppHeader';

interface ChangelogEntry {
  version: string;
  type: 'major' | 'minor' | 'patch';
  changes: string[];
}

interface PackageChangelog {
  name: string;
  entries: ChangelogEntry[];
}

function parseChangelog(content: string, packageName: string): PackageChangelog {
  const entries: ChangelogEntry[] = [];
  const lines = content.split('\n');

  let currentVersion: string | null = null;
  let currentType: 'major' | 'minor' | 'patch' | null = null;
  let currentChanges: string[] = [];
  let currentChangeText = '';

  for (const line of lines) {
    // Match version headers like "## 0.1.3"
    const versionMatch = line.match(/^## (\d+\.\d+\.\d+)/);
    if (versionMatch) {
      // Save previous entry if exists
      if (currentVersion && currentType) {
        if (currentChangeText.trim()) {
          currentChanges.push(currentChangeText.trim());
        }
        entries.push({
          version: currentVersion,
          type: currentType,
          changes: currentChanges,
        });
      }
      currentVersion = versionMatch[1] ?? null;
      currentType = null;
      currentChanges = [];
      currentChangeText = '';
      continue;
    }

    // Match change type headers
    if (line.includes('### Major Changes')) {
      currentType = 'major';
      continue;
    }
    if (line.includes('### Minor Changes')) {
      currentType = 'minor';
      continue;
    }
    if (line.includes('### Patch Changes')) {
      currentType = 'patch';
      continue;
    }

    // Match change items (lines starting with -)
    if (line.startsWith('- ') && currentVersion && currentType) {
      if (currentChangeText.trim()) {
        currentChanges.push(currentChangeText.trim());
      }
      currentChangeText = line.slice(2);
      continue;
    }

    // Continuation of multi-line change
    if (currentChangeText && line.trim() && !line.startsWith('#')) {
      currentChangeText += `\n${line}`;
    }
  }

  // Don't forget the last entry
  if (currentVersion && currentType) {
    if (currentChangeText.trim()) {
      currentChanges.push(currentChangeText.trim());
    }
    entries.push({
      version: currentVersion,
      type: currentType,
      changes: currentChanges,
    });
  }

  return { name: packageName, entries };
}

function discoverPackagesWithChangelog(baseDir: string, namePrefix: string): PackageChangelog[] {
  const results: PackageChangelog[] = [];

  if (!fs.existsSync(baseDir)) {
    return results;
  }

  const entries = fs.readdirSync(baseDir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name.startsWith('.') || entry.name === 'node_modules') {
      continue;
    }

    const pkgDir = path.join(baseDir, entry.name);
    const changelogPath = path.join(pkgDir, 'CHANGELOG.md');
    const packageJsonPath = path.join(pkgDir, 'package.json');

    if (fs.existsSync(changelogPath) && fs.existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
        const content = fs.readFileSync(changelogPath, 'utf-8');
        const changelog = parseChangelog(
          content,
          packageJson.name || `${namePrefix}/${entry.name}`
        );
        if (changelog.entries.length > 0) {
          results.push(changelog);
        }
      } catch {
        // Skip packages with invalid package.json
      }
    }
  }

  return results;
}

function getChangelogs(): { sdk: PackageChangelog[]; tools: PackageChangelog[] } {
  const monorepoRoot = path.resolve(process.cwd(), '../..');

  // Discover SDK packages dynamically
  const sdkPackages = discoverPackagesWithChangelog(
    path.join(monorepoRoot, 'packages'),
    '@tpmjs'
  ).filter(
    (pkg) =>
      pkg.name.startsWith('@tpmjs/') &&
      !pkg.name.includes('tools') &&
      !pkg.name.includes('config') &&
      !pkg.name.includes('storybook')
  );

  // Discover tool packages from multiple locations
  const toolsDir = path.join(monorepoRoot, 'packages/tools');
  const officialToolsDir = path.join(monorepoRoot, 'packages/tools/official');

  const directTools = discoverPackagesWithChangelog(toolsDir, '@tpmjs');
  const officialTools = discoverPackagesWithChangelog(officialToolsDir, '@tpmjs');

  // Combine and dedupe tools
  const toolsMap = new Map<string, PackageChangelog>();
  for (const tool of [...directTools, ...officialTools]) {
    toolsMap.set(tool.name, tool);
  }
  const tools = Array.from(toolsMap.values());

  return { sdk: sdkPackages, tools };
}

function VersionBadge({ type }: { type: 'major' | 'minor' | 'patch' }) {
  const colors = {
    major: 'bg-red-500/20 text-red-400 border-red-500/30',
    minor: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    patch: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  };

  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded border ${colors[type]}`}>{type}</span>
  );
}

function ChangelogCard({ changelog }: { changelog: PackageChangelog }) {
  const latestVersion = changelog.entries[0]?.version || '0.0.0';

  return (
    <div className="border border-border-secondary rounded-lg overflow-hidden bg-background-secondary">
      <div className="px-6 py-4 border-b border-border-secondary bg-background-tertiary">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground font-mono">{changelog.name}</h3>
          <span className="text-sm text-foreground-secondary font-mono">v{latestVersion}</span>
        </div>
      </div>

      <div className="divide-y divide-border-secondary">
        {changelog.entries.map((entry) => (
          <div key={entry.version} className="px-6 py-4">
            <div className="flex items-center gap-3 mb-3">
              <span className="font-mono text-foreground font-medium">{entry.version}</span>
              <VersionBadge type={entry.type} />
            </div>

            <ul className="space-y-2">
              {entry.changes.map((change, i) => (
                <li
                  key={`${entry.version}-${i}`}
                  className="text-sm text-foreground-secondary leading-relaxed"
                >
                  <span className="text-foreground-tertiary mr-2">-</span>
                  <span className="whitespace-pre-wrap">{change}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ChangelogPage() {
  const { sdk, tools } = getChangelogs();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader />

      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-4 py-16">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
              Changelog
            </h1>
            <p className="text-lg text-foreground-secondary max-w-2xl mx-auto">
              Release history for all published TPMJS packages. Track new features, improvements,
              and fixes across our SDK and tools.
            </p>
          </div>

          {/* Legend */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 mb-12 p-4 bg-background-secondary rounded-lg border border-border-secondary">
            <div className="flex items-center gap-2">
              <VersionBadge type="major" />
              <span className="text-sm text-foreground-secondary">Breaking changes</span>
            </div>
            <div className="flex items-center gap-2">
              <VersionBadge type="minor" />
              <span className="text-sm text-foreground-secondary">New features</span>
            </div>
            <div className="flex items-center gap-2">
              <VersionBadge type="patch" />
              <span className="text-sm text-foreground-secondary">Bug fixes</span>
            </div>
          </div>

          {/* SDK Packages */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <svg
                  aria-hidden="true"
                  className="w-4 h-4 text-blue-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
              </span>
              SDK Packages
            </h2>
            <p className="text-foreground-secondary mb-6">
              Core packages for building and integrating with TPMJS.
            </p>

            <div className="space-y-6">
              {sdk.map((changelog) => (
                <ChangelogCard key={changelog.name} changelog={changelog} />
              ))}
            </div>
          </section>

          {/* Tool Packages */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <svg
                  aria-hidden="true"
                  className="w-4 h-4 text-emerald-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z"
                  />
                </svg>
              </span>
              Tool Packages
            </h2>
            <p className="text-foreground-secondary mb-6">
              Official TPMJS tools available on npm. These serve as examples and utilities for the
              registry.
            </p>

            <div className="space-y-6">
              {tools.map((changelog) => (
                <ChangelogCard key={changelog.name} changelog={changelog} />
              ))}
            </div>
          </section>

          {/* CTA */}
          <div className="mt-16 text-center p-8 bg-background-secondary rounded-lg border border-border-secondary">
            <h3 className="text-xl font-semibold text-foreground mb-2">Stay Updated</h3>
            <p className="text-foreground-secondary mb-4">
              Follow the repository for the latest updates and releases.
            </p>
            <a
              href="https://github.com/tpmjs/tpmjs"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-foreground text-background rounded-lg font-medium hover:bg-foreground/90 transition-colors"
            >
              <svg aria-hidden="true" className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path
                  fillRule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                  clipRule="evenodd"
                />
              </svg>
              View on GitHub
            </a>
          </div>
        </div>
      </main>

      <AppFooter />
    </div>
  );
}
