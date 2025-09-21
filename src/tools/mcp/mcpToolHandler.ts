/**
 * MCP Tool Handler
 *
 * Creates ToolHandler functions for MCP tools that bridge MCP tool execution
 * with the standard ToolHandler interface. Handles parameter validation,
 * execution through MCP client, and response normalization.
 *
 * @example
 * ```typescript
 * const handler = createMcpToolHandler(mcpClient, 'calculator');
 * const result = await handler({ operation: 'add', a: 1, b: 2 }, context);
 * ```
 */

import type { ToolHandler } from "../../core/tools/toolHandler";
import type { McpClient } from "./mcpClient";
import { McpConnectionError } from "./mcpConnectionError";
import { McpToolError } from "./mcpToolError";
import { logger } from "../../core/logging";

/**
 * Create a ToolHandler function for an MCP tool
 *
 * @param mcpClient - Connected MCP client instance
 * @param toolName - Name of the MCP tool to handle
 * @returns ToolHandler function that executes the MCP tool
 */
export function createMcpToolHandler(
  mcpClient: McpClient,
  toolName: string,
): ToolHandler {
  return async (parameters: Record<string, unknown>, _context: unknown) => {
    logger.debug("MCP tool execution started", {
      toolName,
      hasParameters: Boolean(parameters && Object.keys(parameters).length > 0),
    });

    try {
      // Validate connection
      if (!mcpClient.isConnected) {
        throw new McpConnectionError("MCP server not connected", {
          toolName,
        });
      }

      // Execute tool on MCP server
      const mcpResult = await mcpClient.callTool(toolName, parameters);

      logger.debug("MCP tool execution completed", {
        toolName,
        contentLength: mcpResult.content?.length || 0,
      });

      // Normalize response to standard tool result format
      return normalizeResponse(mcpResult);
    } catch (error) {
      logger.error("MCP tool execution failed", {
        toolName,
        error: error instanceof Error ? error.message : String(error),
      });

      // Re-throw MCP errors as-is for proper error handling
      if (
        error instanceof McpConnectionError ||
        error instanceof McpToolError
      ) {
        throw error;
      }

      // Wrap other errors in McpToolError
      throw new McpToolError(`Tool execution failed: ${toolName}`, {
        toolName,
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  };
}

/**
 * Normalize MCP tool result to standard tool result format
 *
 * @param mcpResult - Raw result from MCP server
 * @returns Normalized result for tool execution pipeline
 */
function normalizeResponse(mcpResult: {
  content: Array<{ type: string; text?: string; [key: string]: unknown }>;
  isError?: boolean;
}): unknown {
  // Handle error responses
  if (mcpResult.isError) {
    const errorContent = mcpResult.content
      .filter((item) => item.type === "text")
      .map((item) => item.text)
      .join(" ");
    throw new McpToolError(`Tool execution error: ${errorContent}`);
  }

  // Handle empty content
  if (!mcpResult.content || mcpResult.content.length === 0) {
    return { success: true, result: null };
  }

  // For single content item, return the item directly
  if (mcpResult.content.length === 1) {
    const item = mcpResult.content[0];
    if (item.type === "text") {
      return { success: true, result: item.text };
    }
    return { success: true, result: item };
  }

  // For multiple content items, return as array
  return {
    success: true,
    result: mcpResult.content.map((item) => {
      if (item.type === "text") {
        return item.text;
      }
      return item;
    }),
  };
}
