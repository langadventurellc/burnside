/**
 * MCP Tool Definition Interface
 *
 * MCP tool definition from server tool list response.
 * Represents a tool available on an MCP server with its parameter schema.
 *
 * @example
 * ```typescript
 * const mcpTool: McpToolDefinition = {
 *   name: "calculator",
 *   description: "Perform basic arithmetic calculations",
 *   inputSchema: {
 *     type: "object",
 *     properties: {
 *       operation: { type: "string", enum: ["add", "subtract", "multiply", "divide"] },
 *       a: { type: "number" },
 *       b: { type: "number" }
 *     },
 *     required: ["operation", "a", "b"]
 *   }
 * };
 * ```
 *
 * @see {@link https://spec.modelcontextprotocol.io/specification/basic/tools/} MCP Tools Specification
 */

import type { McpJsonSchema } from "./mcpJsonSchema";

export interface McpToolDefinition {
  /**
   * Unique identifier for the tool within the MCP server context.
   * Must follow MCP naming conventions.
   */
  name: string;

  /**
   * Human-readable description of what the tool does.
   * Used for LLM understanding and user interfaces.
   */
  description?: string;

  /**
   * JSON Schema defining the expected input parameters for this tool.
   * Must be a valid JSON Schema object if provided.
   */
  inputSchema?: McpJsonSchema;

  /**
   * Optional JSON Schema defining the expected output format.
   * Not commonly used in MCP but included for completeness.
   */
  outputSchema?: McpJsonSchema;
}
