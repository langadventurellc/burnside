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
    properties: z.record(z.unknown()).optional(),
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
  // If it's already a JSON Schema object, return it
  if (!isZodSchema(schema)) {
    return schema as JSONSchema;
  }

  const zodSchema = schema;

  try {
    return convertZodToJSONSchema(zodSchema);
  } catch (error) {
    throw new ValidationError(
      `Failed to convert Zod schema to JSON Schema: ${error instanceof Error ? error.message : "Unknown error"}`,
      { zodSchema: zodSchema.constructor.name, originalError: error },
    );
  }
}

/**
 * Check if a schema is a Zod schema instance
 */
function isZodSchema(schema: unknown): schema is z.ZodTypeAny {
  return schema instanceof z.ZodType;
}

/**
 * Convert Zod schema to JSON Schema format
 *
 * @param zodSchema - The Zod schema to convert
 * @returns JSON Schema object
 * @throws Error for unsupported Zod schema types
 */
function convertZodToJSONSchema(zodSchema: z.ZodTypeAny): JSONSchema {
  return (
    convertZodObject(zodSchema) ||
    convertZodString(zodSchema) ||
    convertZodNumber(zodSchema) ||
    convertZodBoolean(zodSchema) ||
    convertZodEnum(zodSchema) ||
    convertZodArray(zodSchema) ||
    convertZodOptional(zodSchema) ||
    convertZodDefault(zodSchema) ||
    throwUnsupportedError(zodSchema)
  );
}

/**
 * Convert ZodObject to JSON Schema
 */
function convertZodObject(zodSchema: z.ZodTypeAny): JSONSchema | null {
  if (!(zodSchema instanceof z.ZodObject)) {
    return null;
  }

  const shape = zodSchema._def.shape() as Record<string, z.ZodTypeAny>;
  const properties: Record<string, JSONSchema> = {};
  const required: string[] = [];

  for (const [key, zodValue] of Object.entries(shape)) {
    properties[key] = convertZodToJSONSchema(zodValue);

    // Check if field is required (not optional)
    if (
      !(zodValue instanceof z.ZodOptional) &&
      !(zodValue instanceof z.ZodDefault)
    ) {
      required.push(key);
    }
  }

  const result: JSONSchema = {
    type: "object",
    properties,
    additionalProperties: false,
  };

  if (required.length > 0) {
    result.required = required;
  }

  return result;
}

/**
 * Convert ZodString to JSON Schema
 */
function convertZodString(zodSchema: z.ZodTypeAny): JSONSchema | null {
  if (!(zodSchema instanceof z.ZodString)) {
    return null;
  }

  const jsonSchema: JSONSchema = { type: "string" };

  // Extract description from error messages if available
  const def = zodSchema._def;
  if (def.checks) {
    for (const check of def.checks) {
      if (check.message) {
        jsonSchema.description = check.message;
        break;
      }
    }
  }

  return jsonSchema;
}

/**
 * Convert ZodNumber to JSON Schema
 */
function convertZodNumber(zodSchema: z.ZodTypeAny): JSONSchema | null {
  if (!(zodSchema instanceof z.ZodNumber)) {
    return null;
  }

  const jsonSchema: JSONSchema = { type: "number" };

  // Extract min/max constraints
  const def = zodSchema._def;
  if (def.checks) {
    for (const check of def.checks) {
      if (check.kind === "min") {
        jsonSchema.minimum = check.value;
      } else if (check.kind === "max") {
        jsonSchema.maximum = check.value;
      }
    }
  }

  return jsonSchema;
}

/**
 * Convert ZodBoolean to JSON Schema
 */
function convertZodBoolean(zodSchema: z.ZodTypeAny): JSONSchema | null {
  if (!(zodSchema instanceof z.ZodBoolean)) {
    return null;
  }

  return { type: "boolean" };
}

/**
 * Convert ZodEnum to JSON Schema
 */
function convertZodEnum(zodSchema: z.ZodTypeAny): JSONSchema | null {
  if (!(zodSchema instanceof z.ZodEnum)) {
    return null;
  }

  return {
    type: "string",
    enum: zodSchema._def.values as string[],
  };
}

/**
 * Convert ZodArray to JSON Schema
 */
function convertZodArray(zodSchema: z.ZodTypeAny): JSONSchema | null {
  if (!(zodSchema instanceof z.ZodArray)) {
    return null;
  }

  return {
    type: "array",
    items: convertZodToJSONSchema(zodSchema._def.type as z.ZodTypeAny),
  };
}

/**
 * Convert ZodOptional to JSON Schema
 */
function convertZodOptional(zodSchema: z.ZodTypeAny): JSONSchema | null {
  if (!(zodSchema instanceof z.ZodOptional)) {
    return null;
  }

  return convertZodToJSONSchema(zodSchema._def.innerType as z.ZodTypeAny);
}

/**
 * Convert ZodDefault to JSON Schema
 */
function convertZodDefault(zodSchema: z.ZodTypeAny): JSONSchema | null {
  if (!(zodSchema instanceof z.ZodDefault)) {
    return null;
  }

  const jsonSchema = convertZodToJSONSchema(
    zodSchema._def.innerType as z.ZodTypeAny,
  );
  jsonSchema.default = zodSchema._def.defaultValue();
  return jsonSchema;
}

/**
 * Throw error for unsupported schema types
 */
function throwUnsupportedError(zodSchema: z.ZodTypeAny): never {
  throw new Error(`Unsupported Zod schema type: ${zodSchema.constructor.name}`);
}
