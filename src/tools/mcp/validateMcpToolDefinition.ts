/**
 * MCP Tool Definition Validator
 *
 * Validates that an MCP tool definition is properly formed according to
 * the MCP specification and type requirements.
 *
 * @example
 * ```typescript
 * import { validateMcpToolDefinition } from './validateMcpToolDefinition';
 *
 * const mcpTool = {
 *   name: "calculator",
 *   description: "Perform arithmetic calculations",
 *   inputSchema: {
 *     type: "object",
 *     properties: {
 *       operation: { type: "string" }
 *     }
 *   }
 * };
 *
 * if (validateMcpToolDefinition(mcpTool)) {
 *   // Tool is valid, safe to use
 * }
 * ```
 */

import type { McpToolDefinition } from "./mcpToolDefinition";

/**
 * Validates that an MCP tool definition is properly formed.
 *
 * @param mcpTool - MCP tool to validate
 * @returns True if valid, false otherwise
 */
export function validateMcpToolDefinition(
  mcpTool: unknown,
): mcpTool is McpToolDefinition {
  if (!mcpTool || typeof mcpTool !== "object") {
    return false;
  }

  const tool = mcpTool as Record<string, unknown>;

  // Check required fields
  if (!tool.name || typeof tool.name !== "string") {
    return false;
  }

  // Check optional fields
  if (tool.description !== undefined && typeof tool.description !== "string") {
    return false;
  }

  if (tool.inputSchema !== undefined && !isValidJsonSchema(tool.inputSchema)) {
    return false;
  }

  if (
    tool.outputSchema !== undefined &&
    !isValidJsonSchema(tool.outputSchema)
  ) {
    return false;
  }

  return true;
}

/**
 * Basic validation for JSON Schema objects.
 *
 * @param schema - Schema to validate
 * @returns True if schema appears to be valid JSON Schema
 */
function isValidJsonSchema(schema: unknown): boolean {
  if (!schema || typeof schema !== "object") {
    return false;
  }

  const jsonSchema = schema as Record<string, unknown>;

  // Must have a type field
  if (!jsonSchema.type || typeof jsonSchema.type !== "string") {
    return false;
  }

  // Basic type validation
  const validTypes = ["object", "string", "number", "boolean", "array", "null"];
  if (!validTypes.includes(jsonSchema.type)) {
    return false;
  }

  return true;
}
