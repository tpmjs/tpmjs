/**
 * Helper functions for working with environment variables in agents and collections
 */

import type { Agent, AgentCollection, AgentTool, Collection, Package, Tool } from '@tpmjs/db';
import { prisma } from '@tpmjs/db';
import type { TpmjsEnv } from '@tpmjs/types/tpmjs';

// Reuse the AgentWithRelations type
type AgentWithRelations = Agent & {
  collections: (AgentCollection & {
    collection: Collection & {
      tools: Array<{
        tool: Tool & { package: Package };
      }>;
    };
  })[];
  tools: (AgentTool & {
    tool: Tool & { package: Package };
  })[];
};

/**
 * Get all required environment variables for an agent's tools
 * Collects env vars from all tools in collections and individual tools
 */
export function getRequiredEnvVarsForAgent(agent: AgentWithRelations): TpmjsEnv[] {
  const envVars = new Map<string, TpmjsEnv>();

  // Collect from collections
  for (const agentCollection of agent.collections) {
    for (const collectionTool of agentCollection.collection.tools) {
      const packageEnv = collectionTool.tool.package.env as TpmjsEnv[] | null;
      if (packageEnv && Array.isArray(packageEnv)) {
        for (const env of packageEnv) {
          if (!envVars.has(env.name)) {
            envVars.set(env.name, env);
          }
        }
      }
    }
  }

  // Collect from individual tools
  for (const agentTool of agent.tools) {
    const packageEnv = agentTool.tool.package.env as TpmjsEnv[] | null;
    if (packageEnv && Array.isArray(packageEnv)) {
      for (const env of packageEnv) {
        if (!envVars.has(env.name)) {
          envVars.set(env.name, env);
        }
      }
    }
  }

  return Array.from(envVars.values());
}

/**
 * Get required environment variables for a specific tool in a collection
 */
export async function getRequiredEnvVarsForCollectionTool(
  collectionId: string,
  toolName: string
): Promise<TpmjsEnv[]> {
  const collection = await prisma.collection.findUnique({
    where: { id: collectionId },
    include: {
      tools: {
        include: {
          tool: {
            include: { package: true },
          },
        },
      },
    },
  });

  if (!collection) return [];

  // Parse tool name to find the matching tool
  // Tool names are in format: sanitized-package-name-toolName
  // e.g., "tpmjs-unsandbox-executeCode"
  for (const ct of collection.tools) {
    const pkgName = ct.tool.package.npmPackageName;
    // Sanitize the package name the same way as in tool-converter
    const sanitizedPkg = pkgName.replace(/[@/]/g, '-').replace(/^-+/, '');
    const expectedToolName = `${sanitizedPkg}-${ct.tool.name}`;

    if (toolName === expectedToolName || toolName.includes(sanitizedPkg)) {
      const packageEnv = ct.tool.package.env as TpmjsEnv[] | null;
      return packageEnv || [];
    }
  }

  return [];
}

/**
 * Get all required environment variables for all tools in a collection
 */
export async function getRequiredEnvVarsForCollection(collectionId: string): Promise<TpmjsEnv[]> {
  const collection = await prisma.collection.findUnique({
    where: { id: collectionId },
    include: {
      tools: {
        include: {
          tool: {
            include: { package: true },
          },
        },
      },
    },
  });

  if (!collection) return [];

  const envVars = new Map<string, TpmjsEnv>();

  for (const ct of collection.tools) {
    const packageEnv = ct.tool.package.env as TpmjsEnv[] | null;
    if (packageEnv && Array.isArray(packageEnv)) {
      for (const env of packageEnv) {
        if (!envVars.has(env.name)) {
          envVars.set(env.name, env);
        }
      }
    }
  }

  return Array.from(envVars.values());
}

/**
 * Check which required env vars are missing from provided env vars
 * Returns only the required vars that don't have defaults and aren't provided
 */
export function getMissingEnvVars(
  requiredEnvVars: TpmjsEnv[],
  providedEnvVars: Record<string, string>
): TpmjsEnv[] {
  return requiredEnvVars.filter(
    (env) => env.required !== false && !env.default && !providedEnvVars[env.name]
  );
}

/**
 * Validate that provided env var names are in the allowed list
 * Returns invalid names that shouldn't be accepted
 */
export function getInvalidEnvVarNames(
  providedEnvVars: Record<string, string>,
  allowedEnvNames: string[]
): string[] {
  return Object.keys(providedEnvVars).filter((name) => !allowedEnvNames.includes(name));
}
