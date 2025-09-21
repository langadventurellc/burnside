/**
 * Translate ToolDefinition to MCP format
 *
 * Converts Bridge ToolDefinition objects back to MCP-compatible format,
 * handling both Zod schemas and JSON Schema objects.
 *
 * @example
 * ```typescript
 * import { translateToolDefinitionToMcp } from './translateToolDefinitionToMcp';
 *
 * const toolDefinition: ToolDefinition = {
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
 * const mcpTool = translateToolDefinitionToMcp(toolDefinition);
 * ```
 */

import { z } from "zod";
import type { ToolDefinition } from "../../core/tools/toolDefinition";
import { ToolDefinitionSchema } from "../../core/tools/toolDefinitionSchema";
import { ValidationError } from "../../core/errors/validationError";
import type { McpToolDefinition } from "./mcpToolDefinition";
import type { McpJsonSchema } from "./mcpJsonSchema";

/**
 * Error messages for ToolDefinition to MCP translation.
 */
const TRANSLATION_ERRORS = {
  INVALID_TOOL_DEFINITION: "Invalid ToolDefinition provided",
  VALIDATION_FAILED: "Schema validation failed before translation",
} as const;

/**
 * Translates a Bridge ToolDefinition back to MCP tool format.
 *
 * Converts ToolDefinition objects back to MCP-compatible format,
 * handling both Zod schemas and JSON Schema objects.
 *
 * @param toolDefinition - Bridge ToolDefinition object
 * @returns MCP tool definition
 * @throws ValidationError if translation fails
 */
export function translateToolDefinitionToMcp(
  toolDefinition: ToolDefinition,
): McpToolDefinition {
  // Validate input
  if (!toolDefinition || typeof toolDefinition !== "object") {
    throw new ValidationError(TRANSLATION_ERRORS.INVALID_TOOL_DEFINITION, {
      receivedType: typeof toolDefinition,
    });
  }

  try {
    // Validate against ToolDefinitionSchema first
    const validationResult = ToolDefinitionSchema.safeParse(toolDefinition);

    if (!validationResult.success) {
      throw new ValidationError(TRANSLATION_ERRORS.VALIDATION_FAILED, {
        zodError: validationResult.error,
        originalTool: toolDefinition,
      });
    }

    const validatedTool = validationResult.data;

    // Convert input schema
    let inputSchema: McpJsonSchema | undefined;
    if (validatedTool.inputSchema) {
      if (isZodSchema(validatedTool.inputSchema)) {
        // For Zod schemas, we need to convert to JSON Schema
        // For now, we'll create a simple JSON Schema that accepts any object
        // This is a limitation that could be enhanced in the future
        inputSchema = {
          type: "object",
          properties: {},
          additionalProperties: true,
          description: "Parameters for this tool (Zod schema converted)",
        };
      } else {
        // Already JSON Schema format, use as-is
        inputSchema = validatedTool.inputSchema as McpJsonSchema;
      }
    }

    // Convert output schema
    let outputSchema: McpJsonSchema | undefined;
    if (validatedTool.outputSchema) {
      if (isZodSchema(validatedTool.outputSchema)) {
        // Similar handling for output schema
        outputSchema = {
          type: "object",
          properties: {},
          additionalProperties: true,
          description: "Output format for this tool (Zod schema converted)",
        };
      } else {
        outputSchema = validatedTool.outputSchema as McpJsonSchema;
      }
    }

    return {
      name: validatedTool.name,
      description: validatedTool.description,
      inputSchema,
      outputSchema,
    };
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }

    throw new ValidationError(TRANSLATION_ERRORS.INVALID_TOOL_DEFINITION, {
      originalError: error,
      toolDefinition,
    });
  }
}

/**
 * Type guard to check if a schema is a Zod schema instance.
 *
 * @param schema - Schema to check
 * @returns True if schema is a Zod schema
 */
function isZodSchema(schema: unknown): schema is z.ZodType {
  return (
    schema !== null && typeof schema === "object" && schema instanceof z.ZodType
  );
}
