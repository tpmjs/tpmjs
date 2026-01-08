/**
 * Build AI SDK tools from an agent's collections and individual tools
 */

import type { Agent, AgentCollection, AgentTool, Collection, Package, Tool } from '@tpmjs/db';
import { prisma } from '@tpmjs/db';

import { createToolDefinition } from '../ai-agent/tool-executor-agent';
import { parseExecutorConfig, resolveExecutorConfig } from '../executors';

// Agent type includes executor config fields from Prisma schema
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
 * Fetch a full agent with all tool relations
 * Includes executor config for cascade resolution
 */
export async function fetchAgentWithTools(agentId: string): Promise<AgentWithRelations | null> {
  return prisma.agent.findUnique({
    where: { id: agentId },
    include: {
      collections: {
        include: {
          collection: {
            include: {
              tools: {
                include: {
                  tool: {
                    include: { package: true },
                  },
                },
                orderBy: { position: 'asc' },
              },
            },
          },
        },
        orderBy: { position: 'asc' },
      },
      tools: {
        include: {
          tool: {
            include: { package: true },
          },
        },
        orderBy: { position: 'asc' },
      },
    },
  });
}

/**
 * Fetch an agent by UID with all tool relations
 * Includes executor config for cascade resolution
 */
export async function fetchAgentByUidWithTools(uid: string): Promise<AgentWithRelations | null> {
  return prisma.agent.findUnique({
    where: { uid },
    include: {
      collections: {
        include: {
          collection: {
            include: {
              tools: {
                include: {
                  tool: {
                    include: { package: true },
                  },
                },
                orderBy: { position: 'asc' },
              },
            },
          },
        },
        orderBy: { position: 'asc' },
      },
      tools: {
        include: {
          tool: {
            include: { package: true },
          },
        },
        orderBy: { position: 'asc' },
      },
    },
  });
}

/**
 * Fetch an agent by ID or UID with all tool relations
 * Accepts either the cuid or the user-friendly uid
 * Includes executor config for cascade resolution
 */
export async function fetchAgentByIdOrUidWithTools(
  idOrUid: string
): Promise<AgentWithRelations | null> {
  return prisma.agent.findFirst({
    where: {
      OR: [{ id: idOrUid }, { uid: idOrUid }],
    },
    include: {
      collections: {
        include: {
          collection: {
            include: {
              tools: {
                include: {
                  tool: {
                    include: { package: true },
                  },
                },
                orderBy: { position: 'asc' },
              },
            },
          },
        },
        orderBy: { position: 'asc' },
      },
      tools: {
        include: {
          tool: {
            include: { package: true },
          },
        },
        orderBy: { position: 'asc' },
      },
    },
  });
}

/**
 * Fetch an agent by username and uid with all tool relations
 * Uses the username/uid pretty URL format
 * Includes executor config for cascade resolution
 */
export async function fetchAgentByUsernameAndUidWithTools(
  username: string,
  uid: string
): Promise<AgentWithRelations | null> {
  return prisma.agent.findFirst({
    where: {
      uid,
      user: { username },
    },
    include: {
      collections: {
        include: {
          collection: {
            include: {
              tools: {
                include: {
                  tool: {
                    include: { package: true },
                  },
                },
                orderBy: { position: 'asc' },
              },
            },
          },
        },
        orderBy: { position: 'asc' },
      },
      tools: {
        include: {
          tool: {
            include: { package: true },
          },
        },
        orderBy: { position: 'asc' },
      },
    },
  });
}

/**
 * Sanitize npm package name to valid tool name
 * OpenAI limits tool names to 64 characters
 */
function sanitizeToolName(name: string): string {
  const sanitized = name.replace(/[@/]/g, '-').replace(/^-+/, '');
  // Truncate to 64 chars (OpenAI limit)
  return sanitized.slice(0, 64);
}

/**
 * Build all tools from an agent's collections and individual tools
 * Returns a map of tool name -> AI SDK tool definition
 *
 * Executor config cascade: Agent → Collection → System Default
 * - If agent has an executor config, it's used for all tools
 * - If agent has no config but collection has one, collection's config is used for tools from that collection
 * - If neither has config, system default is used
 */
export function buildAgentTools(
  agent: AgentWithRelations
): Record<string, ReturnType<typeof createToolDefinition>> {
  const tools: Record<string, ReturnType<typeof createToolDefinition>> = {};
  const seenTools = new Set<string>();

  // Parse agent-level executor config
  const agentExecutorConfig = parseExecutorConfig(agent.executorType, agent.executorConfig);

  // Add tools from collections first
  for (const agentCollection of agent.collections) {
    const collection = agentCollection.collection;

    // Parse collection-level executor config
    const collectionExecutorConfig = parseExecutorConfig(
      collection.executorType,
      collection.executorConfig
    );

    // Resolve executor config: Agent → Collection → Default
    const resolvedConfig = resolveExecutorConfig(agentExecutorConfig, collectionExecutorConfig);

    for (const collectionTool of collection.tools) {
      const tool = collectionTool.tool;
      const toolKey = `${tool.package.npmPackageName}::${tool.name}`;

      // Avoid duplicates
      if (seenTools.has(toolKey)) continue;
      seenTools.add(toolKey);

      const toolName = sanitizeToolName(`${tool.package.npmPackageName}-${tool.name}`);
      tools[toolName] = createToolDefinition(tool, resolvedConfig);
    }
  }

  // Add individual tools (may override collection tools)
  // Individual tools use agent config or system default (no collection context)
  const individualToolConfig = agentExecutorConfig ?? { type: 'default' as const };

  for (const agentTool of agent.tools) {
    const tool = agentTool.tool;
    const toolKey = `${tool.package.npmPackageName}::${tool.name}`;

    // Skip if already added from collections
    if (seenTools.has(toolKey)) continue;
    seenTools.add(toolKey);

    const toolName = sanitizeToolName(`${tool.package.npmPackageName}-${tool.name}`);
    tools[toolName] = createToolDefinition(tool, individualToolConfig);
  }

  return tools;
}

/**
 * Get list of tool names for an agent (for display)
 */
export function getAgentToolNames(agent: AgentWithRelations): string[] {
  const names: string[] = [];
  const seenTools = new Set<string>();

  for (const agentCollection of agent.collections) {
    for (const collectionTool of agentCollection.collection.tools) {
      const tool = collectionTool.tool;
      const toolKey = `${tool.package.npmPackageName}::${tool.name}`;
      if (!seenTools.has(toolKey)) {
        seenTools.add(toolKey);
        names.push(sanitizeToolName(`${tool.package.npmPackageName}-${tool.name}`));
      }
    }
  }

  for (const agentTool of agent.tools) {
    const tool = agentTool.tool;
    const toolKey = `${tool.package.npmPackageName}::${tool.name}`;
    if (!seenTools.has(toolKey)) {
      seenTools.add(toolKey);
      names.push(sanitizeToolName(`${tool.package.npmPackageName}-${tool.name}`));
    }
  }

  return names;
}
