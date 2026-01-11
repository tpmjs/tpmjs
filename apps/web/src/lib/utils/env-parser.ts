/**
 * Parse a .env file format string into key-value pairs
 *
 * Supports:
 * - KEY=value
 * - KEY="quoted value"
 * - KEY='single quoted'
 * - # comments
 * - Empty lines
 * - Multiline values with quotes
 */
export function parseEnvString(input: string): Array<{ key: string; value: string }> {
  const lines = input.split('\n');
  const result: Array<{ key: string; value: string }> = [];

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    // Find the first = sign
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();

    // Remove surrounding quotes if present
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (key) {
      result.push({ key: key.toUpperCase(), value });
    }
  }

  return result;
}

/**
 * Convert parsed env vars to a Record object
 */
export function envArrayToRecord(
  vars: Array<{ key: string; value: string }>
): Record<string, string> {
  const record: Record<string, string> = {};
  for (const { key, value } of vars) {
    const trimmedKey = key.trim();
    if (trimmedKey) {
      record[trimmedKey] = value;
    }
  }
  return record;
}

/**
 * Convert a Record to an array of env vars
 */
export function envRecordToArray(
  record: Record<string, string> | null | undefined
): Array<{ key: string; value: string }> {
  if (!record || typeof record !== 'object') {
    return [];
  }
  return Object.entries(record).map(([key, value]) => ({
    key,
    value: String(value),
  }));
}
