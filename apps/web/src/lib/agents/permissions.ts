/**
 * Tool Permission System
 *
 * Resolves per-tool permission policies (allow/ask/deny) with wildcard patterns.
 * First match wins: exact → wildcard (glob) → default.
 */

import type { ToolPermissions } from '@tpmjs/types/agent';
import { ToolPermissionsSchema } from '@tpmjs/types/agent';

/**
 * Parse tool permissions from raw JSON (e.g. from Prisma JsonB field).
 * Returns null if input is null/undefined/invalid (meaning all tools allowed).
 */
export function parseToolPermissions(raw: unknown): ToolPermissions | null {
  if (raw === null || raw === undefined) return null;
  const result = ToolPermissionsSchema.safeParse(raw);
  if (!result.success) return null;
  // If default is 'allow' and no rules, treat same as null (no restrictions)
  if (result.data.default === 'allow' && result.data.rules.length === 0) return null;
  return result.data;
}

/**
 * Check if a tool name matches a pattern.
 * Supports:
 * - Exact match: "shellExec" matches "shellExec"
 * - Wildcard suffix: "sandbox.*" matches "sandbox.readFile", "sandbox.writeFile"
 * - Wildcard prefix: "mcp-*" matches "mcp-github", "mcp-slack"
 * - Single wildcard: "*" matches everything
 */
export function matchesPattern(toolName: string, pattern: string): boolean {
  // Exact match
  if (pattern === toolName) return true;

  // Full wildcard
  if (pattern === '*') return true;

  // Convert glob pattern to regex:
  // Escape regex special chars except *, then replace * with .*
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
  const regex = new RegExp(`^${escaped}$`);
  return regex.test(toolName);
}

/**
 * Resolve the permission for a specific tool name against a permissions config.
 * First matching rule wins. Falls back to the default permission.
 */
export function resolveToolPermission(
  toolName: string,
  permissions: ToolPermissions | null
): 'allow' | 'ask' | 'deny' {
  if (!permissions) return 'allow';

  for (const rule of permissions.rules) {
    if (matchesPattern(toolName, rule.pattern)) {
      return rule.permission;
    }
  }

  return permissions.default;
}

/**
 * Apply tool permissions to a set of built tools.
 * - "deny" → removes the tool entirely (model never sees it)
 * - "ask" → wraps execute with approval handler
 * - "allow" → no change
 *
 * Returns the filtered/wrapped tools map.
 */
// biome-ignore lint/suspicious/noExplicitAny: Generic tool record needs flexible typing
export function applyToolPermissions<T extends Record<string, any>>(
  tools: Record<string, T>,
  permissions: ToolPermissions | null,
  approvalHandler?: ApprovalHandler
): Record<string, T> {
  if (!permissions) return tools;

  const result: Record<string, T> = {};

  for (const [name, toolDef] of Object.entries(tools)) {
    const permission = resolveToolPermission(name, permissions);

    if (permission === 'deny') {
      // Tool is completely hidden from the model
      continue;
    }

    if (permission === 'ask' && approvalHandler && typeof toolDef.execute === 'function') {
      // Wrap execute with approval handler
      const originalExecute = toolDef.execute as (...args: unknown[]) => unknown;
      result[name] = {
        ...toolDef,
        execute: async (...args: unknown[]) => {
          const approved = await approvalHandler(name, args[0]);
          if (!approved) {
            return { error: `Tool "${name}" was denied by the user.` };
          }
          return originalExecute(...args);
        },
      };
    } else {
      result[name] = toolDef;
    }
  }

  return result;
}

/**
 * Approval handler function type.
 * Called when a tool with "ask" permission is invoked.
 * Returns true if approved, false if denied.
 */
export type ApprovalHandler = (toolName: string, input: unknown) => Promise<boolean>;
