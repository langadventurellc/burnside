/**
 * Test Tool Creation for E2E Testing
 *
 * Creates a simple echo tool for E2E testing scenarios with predictable,
 * testable results that can be used across multiple test cases.
 */

import type { ToolDefinition } from "../../../core/tools/toolDefinition";
import { z } from "zod";

/**
 * Creates a simple test tool for E2E testing scenarios.
 *
 * Returns a ToolDefinition with a basic echo functionality that accepts
 * a message parameter and returns predictable, testable results.
 *
 * @returns ToolDefinition for E2E echo tool
 *
 * @example
 * ```typescript
 * const testTool = createTestTool();
 * // testTool.name === "e2e_echo_tool"
 * // Can be registered with BridgeClient for testing
 * ```
 */
export function createTestTool(): ToolDefinition {
  return {
    name: "e2e_echo_tool",
    description:
      "Echo tool for E2E testing - returns input data with test metadata",
    inputSchema: z.object({
      message: z.string().describe("Message to echo back"),
    }),
    outputSchema: z.object({
      echoed: z.string(),
      timestamp: z.string(),
      testSuccess: z.boolean(),
    }),
  };
}
