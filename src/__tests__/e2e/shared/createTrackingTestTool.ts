/**
 * Tracking Test Tool Creation for E2E Testing
 *
 * Creates a test tool with execution tracking capabilities for validating
 * that tools are actually executed during E2E tests.
 */

import type { ToolDefinition } from "../../../core/tools/toolDefinition";
import type { ToolHandler } from "../../../core/tools/toolHandler";
import { createTestTool } from "./createTestTool";
import { testToolHandler } from "./testToolHandler";
import { ExecutionTracker } from "./executionTracker";

/**
 * Creates a test tool with execution tracking
 *
 * @returns Object containing tool definition, execution tracker, and handler
 */
export function createTrackingTestTool(): {
  toolDefinition: ToolDefinition;
  executionTracker: ExecutionTracker;
  handler: ToolHandler;
} {
  const toolDefinition = createTestTool();
  const executionTracker = new ExecutionTracker();
  const handler = executionTracker.createHandler(testToolHandler);

  return {
    toolDefinition,
    executionTracker,
    handler,
  };
}
