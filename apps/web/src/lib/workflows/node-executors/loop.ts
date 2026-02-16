/**
 * Loop node executor - iterates over an array and returns aggregated results
 */
import { resolveTemplate } from '../data-mapping';

export async function executeLoop(
  config: Record<string, unknown>,
  input: unknown
): Promise<unknown> {
  const arrayPath = config.arrayPath as string;
  const maxIterations = (config.maxIterations as number) || 100;

  // Resolve the array to iterate over
  let items: unknown[];

  if (arrayPath && arrayPath.includes('{{')) {
    const resolved = resolveTemplate(arrayPath, new Map(), input);
    items = Array.isArray(resolved) ? resolved : [resolved];
  } else if (Array.isArray(input)) {
    items = input;
  } else if (input && typeof input === 'object' && arrayPath) {
    const value = (input as Record<string, unknown>)[arrayPath];
    items = Array.isArray(value) ? value : [value];
  } else {
    items = [input];
  }

  // Cap at max iterations
  if (items.length > maxIterations) {
    items = items.slice(0, maxIterations);
  }

  // For now, just pass through the items array
  // Full loop execution (running downstream subgraph per item) would require
  // deeper integration with the execution engine
  return {
    items,
    count: items.length,
  };
}
