/**
 * Trigger node executor - passes through the trigger input as-is
 */
export async function executeTrigger(
  _config: Record<string, unknown>,
  input: unknown
): Promise<unknown> {
  return input;
}
