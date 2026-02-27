/**
 * Signature Extractor
 *
 * Generates a TypeScript-style function signature from a JSON Schema input.
 * Example: "(url: string, timeout?: number) => Promise<unknown>"
 */

const MAX_SIGNATURE_LENGTH = 500;

interface JsonSchemaProperty {
  type?: string;
  items?: { type?: string };
  properties?: Record<string, JsonSchemaProperty>;
  description?: string;
}

interface JsonSchema {
  type?: string;
  properties?: Record<string, JsonSchemaProperty>;
  required?: string[];
}

/**
 * Map a JSON Schema type to a TypeScript type string
 */
function mapType(prop: JsonSchemaProperty): string {
  if (!prop.type) return 'unknown';

  switch (prop.type) {
    case 'string':
      return 'string';
    case 'number':
    case 'integer':
      return 'number';
    case 'boolean':
      return 'boolean';
    case 'array':
      if (prop.items?.type) {
        return `${mapType(prop.items)}[]`;
      }
      return 'unknown[]';
    case 'object':
      if (prop.properties) {
        const fields = Object.entries(prop.properties)
          .slice(0, 5) // Limit nested object fields
          .map(([k, v]) => `${k}: ${mapType(v)}`)
          .join('; ');
        return `{ ${fields} }`;
      }
      return 'Record<string, unknown>';
    case 'null':
      return 'null';
    default:
      return 'unknown';
  }
}

/**
 * Extract a TypeScript function signature from a JSON Schema input schema.
 * Returns null if the schema is invalid or empty.
 */
export function extractSignature(inputSchema: unknown): string | null {
  if (!inputSchema || typeof inputSchema !== 'object') return null;

  const schema = inputSchema as JsonSchema;
  if (!schema.properties || Object.keys(schema.properties).length === 0) {
    return '() => Promise<unknown>';
  }

  const required = new Set(schema.required || []);
  const params: string[] = [];

  // Required params first, then optional
  const entries = Object.entries(schema.properties);
  const requiredParams = entries.filter(([key]) => required.has(key));
  const optionalParams = entries.filter(([key]) => !required.has(key));

  for (const [key, prop] of requiredParams) {
    params.push(`${key}: ${mapType(prop)}`);
  }
  for (const [key, prop] of optionalParams) {
    params.push(`${key}?: ${mapType(prop)}`);
  }

  const sig = `(${params.join(', ')}) => Promise<unknown>`;

  // Truncate if too long
  if (sig.length > MAX_SIGNATURE_LENGTH) {
    return `${sig.slice(0, MAX_SIGNATURE_LENGTH - 3)}...`;
  }

  return sig;
}
