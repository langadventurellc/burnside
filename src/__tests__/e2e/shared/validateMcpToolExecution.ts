/**
 * Validate MCP tool execution results
 *
 * Validates that MCP tool execution results match expected format and content.
 * Follows existing validation patterns from E2E test utilities with structured
 * error messages and type checking.
 *
 * @param result - Tool execution result to validate
 * @param expectedEcho - Expected echo content for validation
 *
 * @example
 * ```typescript
 * const result = await client.sendMessage({
 *   messages: [{ role: "user", content: "Use mcp_echo_tool to echo 'test'" }],
 *   tools: ["mcp_echo_tool"]
 * });
 *
 * validateMcpToolExecution(result, "test");
 * ```
 */

import { ValidationError } from "../../../core/errors/validationError";

export function validateMcpToolExecution(
  result: unknown,
  expectedEcho: string,
): void {
  if (!result || typeof result !== "object") {
    throw new ValidationError("MCP tool execution result must be an object");
  }

  const typedResult = result as Record<string, unknown>;

  // Validate basic response structure
  if (!typedResult.content || !Array.isArray(typedResult.content)) {
    throw new ValidationError(
      "MCP tool execution result must have content array",
    );
  }

  const content = typedResult.content as unknown[];
  if (content.length === 0) {
    throw new ValidationError(
      "MCP tool execution result content cannot be empty",
    );
  }

  // Validate first content item has expected structure
  const firstContent = content[0];
  if (!firstContent || typeof firstContent !== "object") {
    throw new ValidationError(
      "MCP tool execution result content item must be an object",
    );
  }

  const contentItem = firstContent as Record<string, unknown>;

  // Validate tool call structure
  if (contentItem.type !== "tool_use") {
    throw new ValidationError(
      "MCP tool execution result must contain tool_use content",
    );
  }

  if (!contentItem.name || contentItem.name !== "mcp_echo_tool") {
    throw new ValidationError(
      "MCP tool execution result must use mcp_echo_tool",
    );
  }

  // Validate tool parameters contain expected echo
  if (!contentItem.input || typeof contentItem.input !== "object") {
    throw new ValidationError(
      "MCP tool execution result must have input object",
    );
  }

  const input = contentItem.input as Record<string, unknown>;
  if (!input.message || input.message !== expectedEcho) {
    throw new ValidationError(
      `MCP tool execution result must echo "${expectedEcho}", got: ${String(input.message)}`,
    );
  }
}
