/**
 * Output node executor - passes through input as the workflow result
 */
export async function executeOutput(
  _config: Record<string, unknown>,
  input: unknown
): Promise<unknown> {
  return input;
}
