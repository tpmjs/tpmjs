/**
 * Transform node executor - applies field mappings to reshape data
 */
import { resolveTemplate } from '../data-mapping';

interface FieldMapping {
  key: string;
  expression: string;
}

export async function executeTransform(
  config: Record<string, unknown>,
  input: unknown
): Promise<unknown> {
  const mappings = (config.mappings as FieldMapping[]) || [];

  if (mappings.length === 0) {
    // Pass through if no mappings
    return input;
  }

  const result: Record<string, unknown> = {};

  for (const mapping of mappings) {
    if (!mapping.key) continue;

    if (mapping.expression.includes('{{')) {
      result[mapping.key] = resolveTemplate(mapping.expression, new Map(), input);
    } else {
      // Treat as a literal value
      result[mapping.key] = mapping.expression;
    }
  }

  return result;
}
