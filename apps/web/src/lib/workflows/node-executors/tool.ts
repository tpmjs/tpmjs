/**
 * Tool node executor - calls executeWithExecutor from the existing executor system
 */
import { prisma } from '@tpmjs/db';
import { executeWithExecutor, parseExecutorConfig } from '~/lib/executors/index';

export async function executeTool(
  config: Record<string, unknown>,
  input: unknown,
  toolId: string
): Promise<unknown> {
  // Load tool details
  const tool = await prisma.tool.findUnique({
    where: { id: toolId },
    include: {
      package: {
        select: {
          npmPackageName: true,
          npmVersion: true,
          env: true,
        },
      },
    },
  });

  if (!tool || !tool.isActive) {
    throw new Error(`Tool not found: ${toolId}`);
  }

  // Resolve parameters from config and input
  const params = (config.params as Record<string, unknown>) || {};

  // Merge input data with configured params (configured params take precedence)
  const mergedParams =
    input && typeof input === 'object' && !Array.isArray(input)
      ? { ...(input as Record<string, unknown>), ...params }
      : params;

  // Parse executor config if any
  const executorConfig = config.executorType
    ? parseExecutorConfig(config.executorType as string, config.executorConfig)
    : null;

  // Execute the tool
  const result = await executeWithExecutor(executorConfig, {
    packageName: tool.package.npmPackageName,
    name: tool.name,
    version: tool.package.npmVersion,
    params: mergedParams,
    env: (tool.package.env as Record<string, string>) || undefined,
  });

  if (!result.success) {
    throw new Error(result.error || 'Tool execution failed');
  }

  return result.output;
}
