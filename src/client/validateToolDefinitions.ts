import type { ToolDefinition } from "../core/tools/toolDefinition";
import { BridgeError } from "../core/errors/bridgeError";

/**
 * Validate tool definitions in a request
 *
 * Validates that tool definitions in a request are properly formatted and
 * contain required fields. Throws descriptive errors for invalid tools.
 *
 * @param tools - Array of tool definitions to validate
 * @throws {BridgeError} When tool definitions are invalid
 *
 * @example
 * ```typescript
 * const tools: ToolDefinition[] = [
 *   { name: "echo", description: "Echo input", inputSchema: { type: "object" } }
 * ];
 *
 * validateToolDefinitions(tools); // Throws if invalid
 * ```
 */
export function validateToolDefinitions(tools: ToolDefinition[]): void {
  if (!Array.isArray(tools)) {
    throw new BridgeError(
      "Tool definitions must be an array",
      "INVALID_TOOL_DEFINITIONS",
      { tools },
    );
  }

  for (let i = 0; i < tools.length; i++) {
    const tool = tools[i];

    if (!tool || typeof tool !== "object") {
      throw new BridgeError(
        `Tool definition at index ${i} must be an object`,
        "INVALID_TOOL_DEFINITION",
        { tool, index: i },
      );
    }

    if (!tool.name || typeof tool.name !== "string") {
      throw new BridgeError(
        `Tool definition at index ${i} must have a valid name`,
        "INVALID_TOOL_NAME",
        { tool, index: i },
      );
    }

    if (!tool.description || typeof tool.description !== "string") {
      throw new BridgeError(
        `Tool definition at index ${i} must have a valid description`,
        "INVALID_TOOL_DESCRIPTION",
        { tool, index: i },
      );
    }

    if (!tool.inputSchema) {
      throw new BridgeError(
        `Tool definition at index ${i} must have an inputSchema`,
        "INVALID_TOOL_INPUT_SCHEMA",
        { tool, index: i },
      );
    }
  }
}
