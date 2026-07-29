import { listToolExports } from '~/lib/schema-extraction';

/**
 * Minimal shape of an existing tool row needed to detect export-name drift.
 * A full Prisma `Tool` row is structurally assignable to this.
 */
export interface ExistingToolHealth {
  importHealth: string | null;
  healthCheckError: string | null;
}

/** A manifest-declared tool whose `name` may not match a real package export. */
export interface DeclaredToolName {
  name?: string;
  /**
   * Manifest-declared parameters (deprecated legacy array). Dropped on
   * reconciliation so the executor extracts the real inputSchema for the
   * corrected export instead of trusting stale, drifted metadata.
   */
  parameters?: unknown;
}

const EXPORT_MISSING_SIGNATURE = /not found in module/i;

/**
 * A declared manifest name is a "phantom" when the registry already holds a row
 * for it that is BROKEN specifically because the export does not exist in the
 * published module. This is the export-name-drift signature: a manifest
 * `tpmjs.tools[].name` that disagrees with the code's actual export name (e.g.
 * a manifest declaring `recipeHash` while the package exports `recipeHashTool`).
 *
 * Gating reconciliation on this exact, structural error keeps the healthy-tool
 * fast path untouched and never rewrites a name over a transient failure.
 */
export function isPhantomExport(existing: ExistingToolHealth | undefined): boolean {
  if (!existing) return false;
  return (
    existing.importHealth === 'BROKEN' &&
    EXPORT_MISSING_SIGNATURE.test(existing.healthCheckError ?? '')
  );
}

/**
 * Choose the real export a phantom declared name should map to. Conservative by
 * design — only returns a target when the match is unambiguous, otherwise null
 * (leave the row untouched rather than guess between sibling exports):
 *   1. an exact `${declaredName}Tool` export (the observed drift pattern), else
 *   2. a single case-insensitive substring match in either direction, else
 *   3. the sole valid tool when the package exports exactly one, else
 *   4. null.
 */
export function pickReconciliationTarget(
  declaredName: string,
  realValidToolNames: readonly string[]
): string | null {
  if (realValidToolNames.length === 0) return null;

  const suffixed = `${declaredName}Tool`;
  if (realValidToolNames.includes(suffixed)) return suffixed;

  const lower = declaredName.toLowerCase();
  const substringMatches = realValidToolNames.filter(
    (name) => name.toLowerCase().includes(lower) || lower.includes(name.toLowerCase())
  );
  if (substringMatches.length === 1) return substringMatches[0] ?? null;

  if (realValidToolNames.length === 1) return realValidToolNames[0] ?? null;

  return null;
}

export interface ReconcileResult<T> {
  tools: T[];
  reconciled: Array<{ from: string; to: string }>;
}

/**
 * Reconcile manifest-declared tool names against the package's real exports.
 *
 * Discovery trusts a package's `tpmjs.tools[].name`. When that declared name
 * drifts from the code's actual export, the registry holds a phantom row that
 * can never pass a health check while the real (valid) export goes unregistered
 * — and the executor-free keyword sweep re-affirms the wrong name on every run.
 * This helper corrects that at the manifest boundary so both sync passes agree
 * on the real export name.
 *
 * The executor is consulted only when at least one declared name is a confirmed
 * phantom, so the common healthy-tool path stays executor-free. Only phantom
 * names are ever rewritten; a declared name that already resolves to a real
 * export is returned unchanged.
 */
export async function reconcileDeclaredToolNames<T extends DeclaredToolName>(params: {
  packageName: string;
  version: string;
  env: Record<string, unknown> | null;
  declaredTools: T[];
  existingByName: ReadonlyMap<string, ExistingToolHealth>;
  /** Injectable for tests; defaults to the real executor call. */
  listExports?: typeof listToolExports;
}): Promise<ReconcileResult<T>> {
  const { packageName, version, env, declaredTools, existingByName } = params;
  const listExports = params.listExports ?? listToolExports;
  const reconciled: Array<{ from: string; to: string }> = [];

  const hasPhantom = declaredTools.some(
    (tool) => tool.name && isPhantomExport(existingByName.get(tool.name))
  );
  if (!hasPhantom) return { tools: declaredTools, reconciled };

  const exportsResult = await listExports(packageName, version, env);
  if (!exportsResult.success) return { tools: declaredTools, reconciled };

  const allExports = new Set(exportsResult.exports);
  const realValidToolNames = exportsResult.tools
    .filter((tool) => tool.isValidTool)
    .map((tool) => tool.name);
  const claimedNames = new Set(
    declaredTools.map((tool) => tool.name).filter((name): name is string => Boolean(name))
  );

  const tools = declaredTools.map((tool): T => {
    if (!tool.name || allExports.has(tool.name)) return tool;
    if (!isPhantomExport(existingByName.get(tool.name))) return tool;

    const target = pickReconciliationTarget(tool.name, realValidToolNames);
    // Never collide with a name already claimed by another declared tool.
    if (!target || claimedNames.has(target)) return tool;

    reconciled.push({ from: tool.name, to: target });
    claimedNames.add(target);
    return { ...tool, name: target, parameters: undefined };
  });

  return { tools, reconciled };
}
