/**
 * xAI Tool Translation Functions
 *
 * Converts unified ToolDefinition format to xAI's function calling format,
 * enabling the xAI provider to use tools defined in the unified format.
 *
 * Handles Zod schema to JSON Schema conversion and supports provider hints
 * for custom xAI function definitions. Since xAI uses OpenAI-compatible
 * format, the implementation follows the same patterns as OpenAI.
 *
 * @example
 * ```typescript
 * import { translateToolDefinitionToXAI } from "./toolTranslator";
 *
 * const xaiTool = translateToolDefinitionToXAI(toolDefinition);
 * // Use in xAI request: { tools: [xaiTool] }
 * ```
 */

import { z } from "zod";
import { ValidationError } from "../../core/errors/validationError";
import type { ToolDefinition } from "../../core/tools/toolDefinition";
import type { XAITool } from "./xaiTool";
import isZodSchema from "../../core/validation/isZodSchema";

/**
 * JSON Schema type definition for xAI parameters
 */
interface JSONSchema {
  type: string;
  properties?: Record<string, JSONSchema>;
  required?: string[];
  items?: JSONSchema;
  enum?: string[];
  minimum?: number;
  maximum?: number;
  default?: unknown;
  description?: string;
  additionalProperties?: boolean;
}

/**
 * xAI function hint structure - matches the expected xAI function format
 */
interface XAIFunctionHint {
  name: string;
  description?: string;
  parameters: {
    type: "object";
    properties?: Record<string, unknown>;
    required?: string[];
    additionalProperties?: boolean;
  };
}

/**
 * Zod schema for validating xAI tools (flat format for Responses API)
 */
const XAIToolSchema = z.object({
  type: z.literal("function"),
  name: z.string(),
  description: z.string().optional(),
  parameters: z.object({
    type: z.literal("object"),
    properties: z.record(z.string(), z.unknown()).optional(),
    required: z.array(z.string()).optional(),
    additionalProperties: z.boolean().optional(),
  }),
});

/**
 * Convert a single ToolDefinition to xAI function format
 *
 * @param toolDef - The unified ToolDefinition to convert
 * @returns xAI tool format object
 * @throws ValidationError for unsupported schema types or invalid tool names
 */
export function translateToolDefinitionToXAI(toolDef: ToolDefinition): XAITool {
  // Check for provider hints first - they override schema conversion
  if (toolDef.hints?.xai) {
    const xaiHints = toolDef.hints.xai as Record<string, unknown>;
    if (xaiHints.function) {
      const hintFunction = xaiHints.function as XAIFunctionHint;
      const xaiTool: XAITool = {
        type: "function",
        name: hintFunction.name,
        description: hintFunction.description,
        parameters: hintFunction.parameters,
      };

      // Validate the hint-based tool conforms to xAI schema
      const result = XAIToolSchema.safeParse(xaiTool);
      if (!result.success) {
        throw new ValidationError(
          `Invalid xAI function hint for tool '${toolDef.name}': ${result.error.message}`,
          { toolName: toolDef.name, zodError: result.error },
        );
      }

      return xaiTool;
    }
  }

  // Extract JSON Schema from the tool's input schema
  const parametersSchema = extractJSONSchemaFromZod(toolDef.inputSchema);

  // Build xAI tool format (flat format for Responses API)
  const xaiTool: XAITool = {
    type: "function",
    name: toolDef.name,
    description: toolDef.description || `Execute ${toolDef.name} tool`,
    parameters: {
      type: "object",
      properties: parametersSchema.properties || {},
      required: parametersSchema.required || [],
      additionalProperties: false,
    },
  };

  // Validate the generated tool conforms to xAI schema
  const result = XAIToolSchema.safeParse(xaiTool);
  if (!result.success) {
    throw new ValidationError(
      `Generated xAI tool format is invalid for '${toolDef.name}': ${result.error.message}`,
      { toolName: toolDef.name, zodError: result.error },
    );
  }

  return xaiTool;
}

/**
 * Extract JSON Schema from Zod schema or return existing JSON Schema
 *
 * @param schema - Zod schema or JSON Schema object
 * @returns JSON Schema compatible with xAI parameters format
 * @throws ValidationError for unsupported Zod schema types
 */
function extractJSONSchemaFromZod(schema: z.ZodTypeAny | object): JSONSchema {
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
 * Convert Zod schema to JSON Schema format
 *
 * @param zodSchema - The Zod schema to convert
 * @returns JSON Schema object
 * @throws Error for unsupported Zod schema types
 */
function convertZodToJSONSchema(zodSchema: z.ZodTypeAny): JSONSchema {
  const jsonSchema = z.toJSONSchema(zodSchema);

  if (
    !jsonSchema ||
    typeof jsonSchema !== "object" ||
    Array.isArray(jsonSchema)
  ) {
    throw new Error(
      `Unsupported JSON Schema output for ${zodSchema.constructor.name}`,
    );
  }

  return jsonSchema as JSONSchema;
}
