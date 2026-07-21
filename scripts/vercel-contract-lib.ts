export interface ToolOperation {
  name: string;
  method: string;
  path: string;
}

export interface OpenApiOperation {
  method: string;
  path: string;
  deprecated: boolean;
}

export interface ContractResult {
  matched: ToolOperation[];
  missing: ToolOperation[];
  unresolved: string[];
  deprecated: ToolOperation[];
}

export interface ManifestResult {
  duplicateDeclarations: string[];
  missingImplementations: string[];
  undeclaredImplementations: string[];
}

const HTTP_METHODS = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']);

function normalizePath(path: string): string {
  return path
    .replace(/\$\{[^}]+\}/g, '{}')
    .replace(/\{[^}]+\}/g, '{}')
    .replace(/\{\}\{\}$/, '{}');
}

export function extractExportedToolNames(source: string): string[] {
  return [...source.matchAll(/^export const\s+(\w+)\s*=\s*tool\s*\(/gm)].map((match) => match[1]);
}

export function verifyManifest(source: string, declaredNames: readonly string[]): ManifestResult {
  const implementedNames = extractExportedToolNames(source);
  return {
    duplicateDeclarations: declaredNames.filter(
      (name, index) => declaredNames.indexOf(name) !== index
    ),
    missingImplementations: declaredNames.filter((name) => !implementedNames.includes(name)),
    undeclaredImplementations: implementedNames.filter((name) => !declaredNames.includes(name)),
  };
}

export function extractToolOperations(source: string): {
  operations: ToolOperation[];
  unresolved: string[];
} {
  const starts = [...source.matchAll(/^export const\s+(\w+)\s*=\s*tool\s*\(/gm)].map((match) => ({
    name: match[1],
    index: match.index,
  }));
  const operations: ToolOperation[] = [];
  const unresolved: string[] = [];

  for (let index = 0; index < starts.length; index += 1) {
    const current = starts[index];
    const block = source.slice(current.index, starts[index + 1]?.index ?? source.length);
    const apiRequest = block.match(
      /apiRequest(?:<[^;]*?>)?\(\s*['"](GET|POST|PUT|PATCH|DELETE|HEAD)['"]\s*,\s*([`'"][^,;\n]+[`'"])/s
    );
    if (apiRequest) {
      operations.push({
        name: current.name,
        method: apiRequest[1],
        path: normalizePath(apiRequest[2].slice(1, -1)),
      });
      continue;
    }

    const directFetch = block.match(
      /fetch\(\s*`\$\{BASE_URL\}([^`]+)`[\s\S]*?method:\s*['"](GET|POST|PUT|PATCH|DELETE|HEAD)['"]/s
    );
    if (directFetch) {
      operations.push({
        name: current.name,
        method: directFetch[2],
        path: normalizePath(directFetch[1]),
      });
      continue;
    }

    unresolved.push(current.name);
  }

  return { operations, unresolved };
}

export function extractOpenApiOperations(document: unknown): OpenApiOperation[] {
  if (typeof document !== 'object' || document === null) {
    throw new Error('OpenAPI document is not an object');
  }
  const paths = (document as Record<string, unknown>).paths;
  if (typeof paths !== 'object' || paths === null) {
    throw new Error('OpenAPI document has no paths object');
  }

  const operations: OpenApiOperation[] = [];
  for (const [path, pathValue] of Object.entries(paths)) {
    if (typeof pathValue !== 'object' || pathValue === null) continue;
    for (const [method, operationValue] of Object.entries(pathValue)) {
      const normalizedMethod = method.toUpperCase();
      if (!HTTP_METHODS.has(normalizedMethod)) continue;
      const deprecated =
        typeof operationValue === 'object' &&
        operationValue !== null &&
        (operationValue as Record<string, unknown>).deprecated === true;
      operations.push({ method: normalizedMethod, path: normalizePath(path), deprecated });
    }
  }
  return operations;
}

export function verifyContract(source: string, document: unknown): ContractResult {
  const extracted = extractToolOperations(source);
  const openApi = extractOpenApiOperations(document);
  const matched: ToolOperation[] = [];
  const missing: ToolOperation[] = [];
  const deprecated: ToolOperation[] = [];

  for (const tool of extracted.operations) {
    const operation = openApi.find(
      (candidate) =>
        candidate.path === tool.path &&
        (candidate.method === tool.method || (tool.method === 'HEAD' && candidate.method === 'GET'))
    );
    if (!operation) {
      missing.push(tool);
      continue;
    }
    matched.push(tool);
    if (operation.deprecated) deprecated.push(tool);
  }

  return { matched, missing, unresolved: extracted.unresolved, deprecated };
}
