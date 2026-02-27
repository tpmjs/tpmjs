/**
 * Build AI SDK tools from an agent's collections and individual tools
 */

import type { Agent, AgentCollection, AgentTool, Collection, Package, Tool } from '@tpmjs/db';
import { prisma } from '@tpmjs/db';

import { jsonSchema } from 'ai';

import { createToolDefinition } from '../ai-agent/tool-executor-agent';
import { executeWithSandbox, parseExecutorConfig, resolveExecutorConfig } from '../executors';
import { type ApprovalHandler, applyToolPermissions, parseToolPermissions } from './permissions';

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
 * Parse environment variables from JSON field
 * Returns empty object if null/undefined or invalid
 */
function parseEnvVars(envVars: unknown): Record<string, string> {
  if (!envVars || typeof envVars !== 'object') {
    return {};
  }
  // Validate all values are strings
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(envVars)) {
    if (typeof value === 'string') {
      result[key] = value;
    }
  }
  return result;
}

/**
 * Merge environment variables with agent envVars taking precedence
 * Collection envVars are used as base, agent envVars override
 */
function mergeEnvVars(
  collectionEnvVars: Record<string, string>,
  agentEnvVars: Record<string, string>
): Record<string, string> {
  return {
    ...collectionEnvVars,
    ...agentEnvVars, // Agent overrides collection
  };
}

/**
 * Inject sandbox tools (shellExec, readFile, writeFile, listFiles)
 * These are hard-coded tool definitions that route directly to the sandbox server.
 */
function injectSandboxTools(
  sandboxUrl: string,
  sandboxApiKey: string | undefined,
  sessionId: string,
  env?: Record<string, string>
): Record<string, ReturnType<typeof createToolDefinition>> {
  const makeSandboxTool = (
    name: string,
    description: string,
    schema: Record<string, unknown>,
    paramMapper: (params: Record<string, unknown>) => Record<string, unknown>
  ) => ({
    description,
    inputSchema: jsonSchema(schema as Parameters<typeof jsonSchema>[0]),
    execute: async (args: Record<string, unknown>) => {
      const result = await executeWithSandbox(
        sandboxUrl,
        sandboxApiKey,
        {
          packageName: '@tpmjs/sandbox-shell',
          name,
          params: paramMapper(args),
          env,
        },
        sessionId
      );
      return result.success ? result.output : { error: result.error };
    },
  });

  return {
    shellExec: makeSandboxTool(
      'shellExec',
      'Execute a shell command in the sandbox workspace. Commands run in a persistent bash session with the workspace as the working directory.',
      {
        type: 'object',
        properties: {
          command: { type: 'string', description: 'Shell command to execute' },
          timeout: {
            type: 'number',
            description: 'Timeout in milliseconds (default: 30000, max: 300000)',
          },
        },
        required: ['command'],
      },
      (p) => p
    ),
    readFile: makeSandboxTool(
      'readFile',
      'Read the contents of a file in the sandbox workspace.',
      {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File path relative to workspace root' },
        },
        required: ['path'],
      },
      (p) => p
    ),
    writeFile: makeSandboxTool(
      'writeFile',
      'Write content to a file in the sandbox workspace. Creates parent directories if needed.',
      {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File path relative to workspace root' },
          content: { type: 'string', description: 'File content to write' },
          createDirs: {
            type: 'boolean',
            description: 'Create parent directories if they do not exist (default: true)',
          },
        },
        required: ['path', 'content'],
      },
      (p) => p
    ),
    listFiles: makeSandboxTool(
      'listFiles',
      'List files and directories in the sandbox workspace.',
      {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'Directory path relative to workspace root (default: ".")',
          },
          recursive: { type: 'boolean', description: 'List files recursively (default: false)' },
          maxDepth: {
            type: 'number',
            description: 'Maximum directory depth for recursive listing (default: 3)',
          },
        },
      },
      (p) => p
    ),
  };
}

/**
 * Build all tools from an agent's collections and individual tools
 * Returns a map of tool name -> AI SDK tool definition
 *
 * Executor config cascade: Agent → Collection → System Default
 * - If agent has an executor config, it's used for all tools
 * - If agent has no config but collection has one, collection's config is used for tools from that collection
 * - If neither has config, system default is used
 *
 * Environment variables cascade: Agent → Collection (merged, agent overrides)
 * - Collection env vars are used as base
 * - Agent env vars override collection env vars for same keys
 * - Both are merged together for unique keys
 *
 * @param agent - The agent with tool relations
 * @param callerEnvVars - Optional env vars provided by the caller (for non-owners accessing public agents).
 *                        When provided, these are used INSTEAD of the agent's stored env vars.
 * @param sessionId - Optional session ID for sandbox executors
 * @param sandboxUrl - Optional sandbox URL for injecting sandbox tools
 * @param sandboxApiKey - Optional sandbox API key
 * @param approvalHandler - Optional handler for tools with "ask" permission
 */
export function buildAgentTools(
  agent: AgentWithRelations,
  callerEnvVars?: Record<string, string>,
  sessionId?: string,
  sandboxUrl?: string,
  sandboxApiKey?: string,
  approvalHandler?: ApprovalHandler
): Record<string, ReturnType<typeof createToolDefinition>> {
  const tools: Record<string, ReturnType<typeof createToolDefinition>> = {};
  const seenTools = new Set<string>();

  // When callerEnvVars is provided (non-owner using public agent), use those exclusively.
  // Otherwise, use the agent's stored env vars.
  const useCallerEnvVars = callerEnvVars !== undefined;
  const agentEnvVars = useCallerEnvVars ? callerEnvVars : parseEnvVars(agent.envVars);

  // Inject sandbox tools first if sandbox is enabled and session is active
  if (sandboxUrl && sessionId) {
    const sandboxTools = injectSandboxTools(sandboxUrl, sandboxApiKey, sessionId, agentEnvVars);
    for (const [name, toolDef] of Object.entries(sandboxTools)) {
      tools[name] = toolDef;
      // Mark sandbox tool package keys as seen to prevent duplicates
      // if the sandbox-shell collection is also attached
      seenTools.add(`@tpmjs/sandbox-shell::${name}`);
    }
  }

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

    // Parse collection-level env vars and merge with agent env vars
    // When callerEnvVars is provided, skip collection env vars entirely
    const collectionEnvVars = useCallerEnvVars ? {} : parseEnvVars(collection.envVars);
    const mergedEnvVars = mergeEnvVars(collectionEnvVars, agentEnvVars);

    for (const collectionTool of collection.tools) {
      const tool = collectionTool.tool;
      const toolKey = `${tool.package.npmPackageName}::${tool.name}`;

      // Avoid duplicates
      if (seenTools.has(toolKey)) continue;
      seenTools.add(toolKey);

      const toolName = sanitizeToolName(`${tool.package.npmPackageName}-${tool.name}`);
      tools[toolName] = createToolDefinition(tool, resolvedConfig, mergedEnvVars);
    }
  }

  // Add individual tools (may override collection tools)
  // Individual tools use agent config or system default (no collection context)
  // Individual tools only use agent env vars (no collection context)
  const individualToolConfig = agentExecutorConfig ?? { type: 'default' as const };

  for (const agentTool of agent.tools) {
    const tool = agentTool.tool;
    const toolKey = `${tool.package.npmPackageName}::${tool.name}`;

    // Skip if already added from collections
    if (seenTools.has(toolKey)) continue;
    seenTools.add(toolKey);

    const toolName = sanitizeToolName(`${tool.package.npmPackageName}-${tool.name}`);
    tools[toolName] = createToolDefinition(tool, individualToolConfig, agentEnvVars);
  }

  // Apply tool permissions: deny removes tools, ask wraps with approval handler
  const permissions = parseToolPermissions(agent.toolPermissions);
  return applyToolPermissions(tools, permissions, approvalHandler);
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

/**
 * Represents a tool in the agent's available pool for dynamic discovery
 */
export interface ToolPoolEntry {
  name: string; // sanitized tool name (used as key in tools map)
  description: string;
  packageName: string;
  toolKey: string; // e.g. "@tpmjs/weather::getWeather"
  tool: Tool & { package: Package };
}

/**
 * Collect all tools from an agent's collections and individual tools into a flat pool.
 * Used by dynamic discovery to build the searchable tool pool.
 */
function collectAllAgentTools(agent: AgentWithRelations): ToolPoolEntry[] {
  const pool: ToolPoolEntry[] = [];
  const seenTools = new Set<string>();

  for (const agentCollection of agent.collections) {
    for (const collectionTool of agentCollection.collection.tools) {
      const tool = collectionTool.tool;
      const toolKey = `${tool.package.npmPackageName}::${tool.name}`;
      if (seenTools.has(toolKey)) continue;
      seenTools.add(toolKey);
      pool.push({
        name: sanitizeToolName(`${tool.package.npmPackageName}-${tool.name}`),
        description: tool.description,
        packageName: tool.package.npmPackageName,
        toolKey,
        tool,
      });
    }
  }

  for (const agentTool of agent.tools) {
    const tool = agentTool.tool;
    const toolKey = `${tool.package.npmPackageName}::${tool.name}`;
    if (seenTools.has(toolKey)) continue;
    seenTools.add(toolKey);
    pool.push({
      name: sanitizeToolName(`${tool.package.npmPackageName}-${tool.name}`),
      description: tool.description,
      packageName: tool.package.npmPackageName,
      toolKey,
      tool,
    });
  }

  return pool;
}

export interface DynamicToolsResult {
  tools: Record<string, ReturnType<typeof createToolDefinition>>;
  allToolPool: ToolPoolEntry[];
  isDynamic: boolean;
}

/**
 * Build tools with optional dynamic discovery mode.
 * When dynamicToolDiscovery is enabled, only sandbox tools + searchTools meta-tool are built initially.
 * Other tools are discovered on-demand via the searchTools meta-tool.
 */
export function buildAgentToolsWithDiscovery(
  agent: AgentWithRelations,
  callerEnvVars?: Record<string, string>,
  sessionId?: string,
  sandboxUrl?: string,
  sandboxApiKey?: string,
  approvalHandler?: ApprovalHandler
): DynamicToolsResult {
  if (!agent.dynamicToolDiscovery) {
    return {
      tools: buildAgentTools(
        agent,
        callerEnvVars,
        sessionId,
        sandboxUrl,
        sandboxApiKey,
        approvalHandler
      ),
      allToolPool: [],
      isDynamic: false,
    };
  }

  const allToolPool = collectAllAgentTools(agent);
  const tools: Record<string, ReturnType<typeof createToolDefinition>> = {};

  // Inject sandbox tools if enabled
  const useCallerEnvVars = callerEnvVars !== undefined;
  const agentEnvVars = useCallerEnvVars ? callerEnvVars : parseEnvVars(agent.envVars);

  if (sandboxUrl && sessionId) {
    const sandboxTools = injectSandboxTools(sandboxUrl, sandboxApiKey, sessionId, agentEnvVars);
    for (const [name, toolDef] of Object.entries(sandboxTools)) {
      tools[name] = toolDef;
    }
  }

  // Add the searchTools meta-tool
  tools.searchTools = createSearchToolsDefinition(allToolPool);

  // Apply permissions
  const permissions = parseToolPermissions(agent.toolPermissions);
  return {
    tools: applyToolPermissions(tools, permissions, approvalHandler),
    allToolPool,
    isDynamic: true,
  };
}

/**
 * Create the searchTools meta-tool definition that searches the agent's tool pool
 */
function createSearchToolsDefinition(
  toolPool: ToolPoolEntry[]
): ReturnType<typeof createToolDefinition> {
  return {
    description:
      'Search the available tool pool by keyword. Use this to find tools relevant to the current task. Returns top 5 matching tools with name, description, and package.',
    inputSchema: jsonSchema({
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query to find relevant tools',
        },
      },
      required: ['query'],
    }),
    execute: async (args: Record<string, unknown>) => {
      const { scoreBM25 } = await import('../search/bm25');
      const query = String(args.query || '');
      if (!query) return { results: [] };

      const documents = toolPool.map((entry) => ({
        item: entry,
        text: `${entry.name} ${entry.description} ${entry.packageName}`,
      }));

      const results = scoreBM25(query, documents);

      return {
        results: results.slice(0, 5).map(({ item, score }) => ({
          name: item.name,
          description: item.description,
          packageName: item.packageName,
          score: Math.round(score * 100) / 100,
        })),
      };
    },
  };
}
