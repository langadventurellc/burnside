/**
 * Validate MCP Tool Result Function
 *
 * Validates MCP tool execution results against expected criteria.
 */

import type { McpToolResultExpectation } from "./mcpToolResultExpectation";

/**
 * Validate MCP tool execution result
 *
 * @param result - Tool execution result to validate
 * @param expectation - Expected result criteria
 * @throws Error if validation fails
 */
export function validateMcpToolResult(
  result: unknown,
  expectation: McpToolResultExpectation,
): void {
  if (!result || typeof result !== "object") {
    throw new Error("Tool result must be an object");
  }

  const toolResult = result as {
    content?: Array<{ type: string; text?: string; data?: unknown }>;
    isError?: boolean;
  };

  if (!toolResult.content || !Array.isArray(toolResult.content)) {
    throw new Error("Tool result must have content array");
  }

  if (toolResult.content.length === 0) {
    throw new Error("Tool result content cannot be empty");
  }

  const content = toolResult.content[0];

  // Validate content type
  if (expectation.contentType && content.type !== expectation.contentType) {
    throw new Error(
      `Expected content type '${expectation.contentType}', got '${content.type}'`,
    );
  }

  // Validate error status
  if (expectation.shouldSucceed === false && !toolResult.isError) {
    throw new Error("Expected tool to indicate error but it didn't");
  }

  if (expectation.shouldSucceed === true && toolResult.isError) {
    throw new Error("Expected tool to succeed but it indicated error");
  }

  // Validate text content
  if (expectation.textPattern && content.text) {
    if (typeof expectation.textPattern === "string") {
      if (content.text !== expectation.textPattern) {
        throw new Error(
          `Expected text '${expectation.textPattern}', got '${content.text}'`,
        );
      }
    } else {
      if (!expectation.textPattern.test(content.text)) {
        throw new Error(
          `Text '${content.text}' does not match pattern ${String(expectation.textPattern)}`,
        );
      }
    }
  }

  // Validate data structure for JSON content
  if (expectation.expectedData && content.text) {
    try {
      const parsedData = JSON.parse(content.text) as Record<string, unknown>;
      for (const [key, expectedValue] of Object.entries(
        expectation.expectedData,
      )) {
        if (parsedData[key] !== expectedValue) {
          throw new Error(
            `Expected data.${key} to be '${String(expectedValue)}', got '${String(parsedData[key])}'`,
          );
        }
      }
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error(`Tool result text is not valid JSON: ${content.text}`);
      }
      throw error;
    }
  }
}
