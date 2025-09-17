/**
 * Test Tool Handler for E2E Testing
 *
 * Provides a test tool handler implementation that returns predictable
 * results for E2E testing scenarios.
 */

import type { ToolHandler } from "../../../core/tools/toolHandler";

/**
 * Test tool handler for the E2E echo tool.
 *
 * Processes input parameters and returns predictable results for testing.
 * Always returns testSuccess: true for validation purposes.
 *
 * @param parameters - Input parameters from tool call
 * @param context - Tool execution context (unused in test implementation)
 * @returns Promise resolving to test result object
 *
 * @example
 * ```typescript
 * const result = await testToolHandler({ message: "hello" });
 * // Returns: { echoed: "hello", timestamp: "2024-...", testSuccess: true }
 * ```
 */
export const testToolHandler: ToolHandler = (
  parameters: Record<string, unknown>,
): Promise<unknown> => {
  // Validate input has message parameter
  const message = parameters.message;
  if (typeof message !== "string") {
    return Promise.reject(
      new Error("Test tool requires 'message' parameter of type string"),
    );
  }

  return Promise.resolve({
    echoed: message,
    timestamp: new Date().toISOString(),
    testSuccess: true,
  });
};
