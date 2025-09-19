import type { ChatRequest } from "./chatRequest";

/**
 * Determines whether multi-turn execution should be enabled based on request configuration
 *
 * Multi-turn execution is enabled when:
 * 1. Tools are provided in the request
 * 2. Tools are enabled in the client configuration
 * 3. Multi-turn configuration is explicitly provided in the request
 *
 * This enables backward compatibility - requests without multiTurn configuration
 * will continue to use single-turn tool execution even when tools are present.
 *
 * @param request - The chat request to evaluate
 * @param toolsEnabled - Whether tools are enabled in the client configuration
 * @returns true if multi-turn execution should be used, false for single-turn execution
 *
 * @example
 * ```typescript
 * // Single-turn: tools present but no multiTurn config
 * const singleTurnRequest: ChatRequest = {
 *   messages: [...],
 *   model: "gpt-4",
 *   tools: [{ name: "echo", ... }]
 *   // No multiTurn property
 * };
 * shouldExecuteMultiTurn(singleTurnRequest, true); // false
 *
 * // Multi-turn: tools present with multiTurn config
 * const multiTurnRequest: ChatRequest = {
 *   messages: [...],
 *   model: "gpt-4",
 *   tools: [{ name: "echo", ... }],
 *   multiTurn: { maxIterations: 5 }
 * };
 * shouldExecuteMultiTurn(multiTurnRequest, true); // true
 * ```
 */
export function shouldExecuteMultiTurn(
  request: ChatRequest,
  toolsEnabled: boolean,
): boolean {
  // All conditions must be met for multi-turn execution
  return (
    request.tools !== undefined &&
    request.tools.length > 0 &&
    toolsEnabled &&
    request.multiTurn !== undefined
  );
}
