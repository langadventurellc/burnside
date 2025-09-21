/**
 * Translate MCP to ToolDefinition
 *
 * Converts MCP tool definitions to Bridge ToolDefinition format.
 * Preserves JSON Schema format for validation while ensuring compatibility
 * with the unified ToolDefinition interface.
 *
 * @example
 * ```typescript
 * import { translateMcpToToolDefinition } from './translateMcpToToolDefinition';
 *
 * const mcpTool = {
 *   name: "calculator",
 *   description: "Perform arithmetic calculations",
 *   inputSchema: {
 *     type: "object",
 *     properties: {
 *       operation: { type: "string", enum: ["add", "subtract"] },
 *       a: { type: "number" },
 *       b: { type: "number" }
 *     },
 *     required: ["operation", "a", "b"]
 *   }
 * };
 *
 * const toolDefinition = translateMcpToToolDefinition(mcpTool);
 * ```
 */

import type { ToolDefinition } from "../../core/tools/toolDefinition";
import { ToolDefinitionSchema } from "../../core/tools/toolDefinitionSchema";
import { ValidationError } from "../../core/errors/validationError";
import type { McpToolDefinition } from "./mcpToolDefinition";

/**
 * Error messages for MCP to ToolDefinition translation.
 */
const TRANSLATION_ERRORS = {
  INVALID_MCP_TOOL: "Invalid MCP tool definition provided",
  VALIDATION_FAILED: "Schema validation failed after translation",
  MISSING_REQUIRED_FIELDS: "Missing required fields in tool definition",
} as const;

/**
 * Translates an MCP tool definition to Bridge ToolDefinition format.
 *
 * Preserves the JSON Schema format for validation while ensuring
 * compatibility with the unified ToolDefinition interface.
 *
 * @param mcpTool - MCP tool definition from server
 * @returns Translated ToolDefinition object
 * @throws ValidationError if translation fails or validation errors occur
 */
export function translateMcpToToolDefinition(
  mcpTool: McpToolDefinition,
): ToolDefinition {
  // Validate input MCP tool
  if (!mcpTool || typeof mcpTool !== "object") {
    throw new ValidationError(TRANSLATION_ERRORS.INVALID_MCP_TOOL, {
      receivedType: typeof mcpTool,
    });
  }

  if (!mcpTool.name || typeof mcpTool.name !== "string") {
    throw new ValidationError(TRANSLATION_ERRORS.MISSING_REQUIRED_FIELDS, {
      missingField: "name",
      received: mcpTool,
    });
  }

  try {
    // Create ToolDefinition with JSON Schema format
    // TypeScript will infer the correct type for JSON schema objects
    const defaultInputSchema = {
      type: "object" as const,
      properties: {},
      required: [],
    };

    const toolDefinition: ToolDefinition = {
      name: mcpTool.name,
      description: mcpTool.description,
      inputSchema: mcpTool.inputSchema || defaultInputSchema,
      outputSchema: mcpTool.outputSchema,
    };

    // Validate the result against ToolDefinitionSchema
    const validationResult = ToolDefinitionSchema.safeParse(toolDefinition);

    if (!validationResult.success) {
      throw new ValidationError(TRANSLATION_ERRORS.VALIDATION_FAILED, {
        zodError: validationResult.error,
        originalTool: mcpTool,
      });
    }

    return validationResult.data;
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }

    throw new ValidationError(TRANSLATION_ERRORS.INVALID_MCP_TOOL, {
      originalError: error,
      mcpTool,
    });
  }
}
