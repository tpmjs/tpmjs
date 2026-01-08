import type { ActivityType, Prisma } from '@prisma/client';
import { prisma } from '@tpmjs/db';

export interface LogActivityParams {
  userId: string;
  type: ActivityType;
  targetName: string;
  targetType: 'agent' | 'collection' | 'tool';
  agentId?: string;
  collectionId?: string;
  toolId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Log user activity (fire-and-forget pattern)
 * Never throws - failures are logged but don't break the main operation
 */
export async function logActivity(params: LogActivityParams): Promise<void> {
  try {
    await prisma.userActivity.create({
      data: {
        userId: params.userId,
        type: params.type,
        targetName: params.targetName,
        targetType: params.targetType,
        agentId: params.agentId,
        collectionId: params.collectionId,
        toolId: params.toolId,
        metadata: params.metadata as Prisma.InputJsonValue | undefined,
      },
    });
  } catch (error) {
    // Never throw - activity logging should never break main operations
    console.error('Failed to log activity:', error);
  }
}

/**
 * Activity type to human-readable message mapping
 */
export const ACTIVITY_MESSAGES: Record<
  ActivityType,
  (targetName: string, metadata?: Record<string, unknown>) => string
> = {
  AGENT_CREATED: (name) => `Created agent "${name}"`,
  AGENT_UPDATED: (name) => `Updated agent "${name}"`,
  AGENT_DELETED: (name) => `Deleted agent "${name}"`,
  AGENT_CLONED: (name) => `Cloned agent "${name}"`,
  AGENT_TOOL_ADDED: (name, meta) =>
    meta?.toolName
      ? `Added tool "${meta.toolName}" to agent "${name}"`
      : `Added tool to agent "${name}"`,
  AGENT_TOOL_REMOVED: (name, meta) =>
    meta?.toolName
      ? `Removed tool "${meta.toolName}" from agent "${name}"`
      : `Removed tool from agent "${name}"`,
  AGENT_COLLECTION_ADDED: (name, meta) =>
    meta?.collectionName
      ? `Added collection "${meta.collectionName}" to agent "${name}"`
      : `Added collection to agent "${name}"`,
  AGENT_COLLECTION_REMOVED: (name, meta) =>
    meta?.collectionName
      ? `Removed collection "${meta.collectionName}" from agent "${name}"`
      : `Removed collection from agent "${name}"`,
  COLLECTION_CREATED: (name) => `Created collection "${name}"`,
  COLLECTION_UPDATED: (name) => `Updated collection "${name}"`,
  COLLECTION_DELETED: (name) => `Deleted collection "${name}"`,
  COLLECTION_CLONED: (name) => `Cloned collection "${name}"`,
  COLLECTION_TOOL_ADDED: (name, meta) =>
    meta?.toolName
      ? `Added tool "${meta.toolName}" to collection "${name}"`
      : `Added tool to collection "${name}"`,
  COLLECTION_TOOL_REMOVED: (name, meta) =>
    meta?.toolName
      ? `Removed tool "${meta.toolName}" from collection "${name}"`
      : `Removed tool from collection "${name}"`,
  TOOL_LIKED: (name) => `Liked tool "${name}"`,
  TOOL_UNLIKED: (name) => `Unliked tool "${name}"`,
  COLLECTION_LIKED: (name) => `Liked collection "${name}"`,
  COLLECTION_UNLIKED: (name) => `Unliked collection "${name}"`,
  AGENT_LIKED: (name) => `Liked agent "${name}"`,
  AGENT_UNLIKED: (name) => `Unliked agent "${name}"`,
};

/**
 * Activity type to icon name mapping (for UI)
 */
export const ACTIVITY_ICONS: Record<ActivityType, string> = {
  AGENT_CREATED: 'plus',
  AGENT_UPDATED: 'pencil',
  AGENT_DELETED: 'trash',
  AGENT_CLONED: 'copy',
  AGENT_TOOL_ADDED: 'link',
  AGENT_TOOL_REMOVED: 'unlink',
  AGENT_COLLECTION_ADDED: 'folderPlus',
  AGENT_COLLECTION_REMOVED: 'folderMinus',
  COLLECTION_CREATED: 'folderPlus',
  COLLECTION_UPDATED: 'pencil',
  COLLECTION_DELETED: 'trash',
  COLLECTION_CLONED: 'copy',
  COLLECTION_TOOL_ADDED: 'link',
  COLLECTION_TOOL_REMOVED: 'unlink',
  TOOL_LIKED: 'heart',
  TOOL_UNLIKED: 'heartOff',
  COLLECTION_LIKED: 'heart',
  COLLECTION_UNLIKED: 'heartOff',
  AGENT_LIKED: 'heart',
  AGENT_UNLIKED: 'heartOff',
};
