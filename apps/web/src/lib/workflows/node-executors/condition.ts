/**
 * Condition node executor - evaluates a condition and returns the branch name
 */
import { resolveTemplate } from '../data-mapping';

export async function executeCondition(
  config: Record<string, unknown>,
  input: unknown
): Promise<{ branch: string; value: unknown }> {
  const field = config.field as string;
  const operator = (config.operator as string) || '===';
  const compareValue = config.value as string | undefined;

  // Resolve the field value
  let fieldValue: unknown;
  if (field && field.includes('{{')) {
    fieldValue = resolveTemplate(field, new Map(), input);
  } else if (field && input && typeof input === 'object') {
    fieldValue = (input as Record<string, unknown>)[field];
  } else {
    fieldValue = input;
  }

  let result: boolean;

  switch (operator) {
    case '===':
      result = String(fieldValue) === String(compareValue);
      break;
    case '!==':
      result = String(fieldValue) !== String(compareValue);
      break;
    case '>':
      result = Number(fieldValue) > Number(compareValue);
      break;
    case '<':
      result = Number(fieldValue) < Number(compareValue);
      break;
    case 'includes':
      result =
        typeof fieldValue === 'string' && typeof compareValue === 'string'
          ? fieldValue.includes(compareValue)
          : Array.isArray(fieldValue)
            ? fieldValue.includes(compareValue)
            : false;
      break;
    case 'exists':
      result =
        fieldValue !== undefined &&
        fieldValue !== null &&
        fieldValue !== '' &&
        fieldValue !== false;
      break;
    default:
      result = Boolean(fieldValue);
  }

  return {
    branch: result ? 'true' : 'false',
    value: fieldValue,
  };
}
