/**
 * Determine if tools should be executed based on request and configuration
 *
 * Checks whether tool execution should be performed based on the presence of
 * tools in the request and the client's tool system configuration.
 *
 * @param hasTools - Whether the request includes tool definitions
 * @param toolsEnabled - Whether the tool system is enabled in configuration
 * @returns True if tools should be executed
 *
 * @example
 * ```typescript
 * const shouldExecute = shouldExecuteTools(
 *   request.tools && request.tools.length > 0,
 *   config.tools?.enabled === true
 * );
 * ```
 */
export function shouldExecuteTools(
  hasTools: boolean,
  toolsEnabled: boolean,
): boolean {
  return hasTools && toolsEnabled;
}
