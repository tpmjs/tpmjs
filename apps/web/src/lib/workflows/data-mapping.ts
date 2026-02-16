/**
 * Data mapping utilities for workflow execution
 * Resolves template expressions like {{nodeId.output.path}} using the execution context
 */

type ContextMap = Map<string, unknown>;

/**
 * Resolve a template string by replacing {{nodeId.output.path}} expressions
 * with actual values from the execution context
 */
export function resolveTemplate(
  template: string,
  context: ContextMap,
  currentInput: unknown
): unknown {
  // If the entire string is a single template expression, return the raw value (not stringified)
  const singleMatch = template.match(/^\{\{(.+?)\}\}$/);
  if (singleMatch?.[1]) {
    return resolveExpression(singleMatch[1].trim(), context, currentInput);
  }

  // Otherwise, replace all expressions with stringified values
  return template.replace(/\{\{(.+?)\}\}/g, (_match, expression: string) => {
    const value = resolveExpression(expression.trim(), context, currentInput);
    if (value === undefined || value === null) return '';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  });
}

/**
 * Resolve a dot-path expression against the context
 * Supports: input.field, nodeId.output.path, nodeId.field
 */
function resolveExpression(
  expression: string,
  context: ContextMap,
  currentInput: unknown
): unknown {
  // "input" refers to the current node's resolved input
  if (expression === 'input') {
    return currentInput;
  }
  if (expression.startsWith('input.')) {
    return getNestedValue(currentInput, expression.slice(6));
  }

  // Otherwise, first segment is a nodeId
  const dotIndex = expression.indexOf('.');
  if (dotIndex === -1) {
    return context.get(expression);
  }

  const nodeId = expression.slice(0, dotIndex);
  const path = expression.slice(dotIndex + 1);

  const nodeOutput = context.get(nodeId);
  if (nodeOutput === undefined) return undefined;

  // If path starts with "output.", skip it
  const effectivePath = path.startsWith('output.') ? path.slice(7) : path;
  if (effectivePath === 'output' || effectivePath === '') return nodeOutput;

  return getNestedValue(nodeOutput, effectivePath);
}

/**
 * Get a nested value from an object using dot notation
 */
function getNestedValue(obj: unknown, path: string): unknown {
  const parts = path.split('.');
  let current = obj;

  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    if (typeof current !== 'object') return undefined;

    // Handle array indexing
    if (Array.isArray(current)) {
      const index = Number.parseInt(part, 10);
      if (Number.isNaN(index)) return undefined;
      current = current[index];
    } else {
      current = (current as Record<string, unknown>)[part];
    }
  }

  return current;
}

/**
 * Resolve all template values in an object/params recursively
 */
export function resolveParams(
  params: Record<string, unknown>,
  context: ContextMap,
  currentInput: unknown
): Record<string, unknown> {
  const resolved: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(params)) {
    if (typeof value === 'string' && value.includes('{{')) {
      resolved[key] = resolveTemplate(value, context, currentInput);
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      resolved[key] = resolveParams(value as Record<string, unknown>, context, currentInput);
    } else {
      resolved[key] = value;
    }
  }

  return resolved;
}
