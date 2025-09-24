/**
 * Anthropic Tool Definition Translation
 *
 * Converts unified ToolDefinition format to Anthropic's tool format,
 * enabling the Anthropic provider to use tools defined in the unified format.
 *
 * @example
 * ```typescript
 * import { translateToolDefinitions } from "./toolTranslator";
 *
 * const anthropicTools = translateToolDefinitions(toolDefinitions);
 * // Use in Anthropic request: { tools: anthropicTools }
 * ```
 */

import { z } from "zod";
import type { ToolDefinition } from "../../core/tools/toolDefinition";
import { ValidationError } from "../../core/errors/validationError";
import isZodSchema from "../../core/validation/isZodSchema";

/**
 * Anthropic tool definition type
 */
interface AnthropicTool {
  name: string;
  description?: string;
  input_schema: Record<string, unknown>;
}

/**
 * JSON Schema type definition for Anthropic input schemas
 */
interface JSONSchema {
  type: string;
  properties?: Record<string, JSONSchema>;
  required?: string[];
  items?: JSONSchema;
  enum?: unknown[];
  description?: string;
  additionalProperties?: boolean;
  default?: unknown;
}

/**
 * Convert an array of ToolDefinitions to Anthropic tool format
 *
 * @param tools - Array of unified ToolDefinitions to convert
 * @returns Array of Anthropic tool format objects
 * @throws ValidationError for unsupported schema types or invalid tool definitions
 */
export function translateToolDefinitions(
  tools: ToolDefinition[],
): AnthropicTool[] {
  return tools.map((tool) => {
    try {
      // Check for Anthropic provider hints first
      if (tool.hints?.anthropic) {
        const anthropicHints = tool.hints.anthropic as Record<string, unknown>;
        if (anthropicHints.tool) {
          return anthropicHints.tool as AnthropicTool;
        }
      }

      // Convert input schema to JSON Schema
      const jsonSchema = zodToJsonSchema(tool.inputSchema);

      return {
        name: tool.name,
        description: tool.description || `Execute ${tool.name}`,
        input_schema: jsonSchema as unknown as Record<string, unknown>,
      };
    } catch (error) {
      throw new ValidationError(
        `Failed to translate tool definition: ${tool.name}`,
        { cause: error, context: { toolName: tool.name } },
      );
    }
  });
}

/**
 * Convert Zod schema to JSON Schema format for Anthropic
 *
 * @param schema - Zod schema to convert
 * @returns JSON Schema object compatible with Anthropic's input_schema
 * @throws ValidationError for unsupported Zod schema types
 */
function zodToJsonSchema(schema: z.ZodTypeAny | object): JSONSchema {
  if (!isZodSchema(schema)) {
    return schema as JSONSchema;
  }

  try {
    return convertZodToJSONSchema(schema);
  } catch (error) {
    throw new ValidationError(
      `Failed to convert Zod schema to JSON Schema: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      { zodSchema: schema.constructor.name, originalError: error },
    );
  }
}

/**
 * Convert Zod schema to JSON Schema
 */
function convertZodToJSONSchema(schema: z.ZodTypeAny): JSONSchema {
  const jsonSchema = z.toJSONSchema(schema);

  if (
    !jsonSchema ||
    typeof jsonSchema !== "object" ||
    Array.isArray(jsonSchema)
  ) {
    throw new Error(
      `Unsupported JSON Schema output for ${schema.constructor.name}`,
    );
  }

  return jsonSchema as JSONSchema;
}
