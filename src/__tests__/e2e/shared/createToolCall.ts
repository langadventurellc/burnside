/**
 * Tool Call Creation for E2E Testing
 *
 * Creates ToolCall objects for testing purposes with predictable
 * IDs and test tool configuration.
 */

import type { ToolCall } from "../../../core/tools/toolCall";

/**
 * Creates a ToolCall object for testing purposes.
 *
 * Generates a unified ToolCall with predictable ID and test tool name
 * for consistent E2E testing scenarios.
 *
 * @param message - Message to include in tool call parameters
 * @returns ToolCall object ready for testing
 *
 * @example
 * ```typescript
 * const toolCall = createToolCall("test message");
 * // Returns: { id: "test_call_...", name: "e2e_echo_tool", parameters: { message: "test message" } }
 * ```
 */
export function createToolCall(message: string): ToolCall {
  return {
    id: `test_call_${Date.now()}`,
    name: "e2e_echo_tool",
    parameters: { message },
    metadata: {
      providerId: "test",
      timestamp: new Date().toISOString(),
    },
  };
}
