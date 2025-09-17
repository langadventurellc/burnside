/**
 * Anthropic Tool Definition Translation
 *
 * Converts unified ToolDefinition format to Anthropic's tool format,
 * enabling the Anthropic provider to use tools defined in the unified format.
 *
 * @example
 * ```typescript
 * import { translateToolDefinitions } from "./toolTranslator.js";
 *
 * const anthropicTools = translateToolDefinitions(toolDefinitions);
 * // Use in Anthropic request: { tools: anthropicTools }
 * ```
 */

import { z } from "zod";
import type { ToolDefinition } from "../../core/tools/toolDefinition.js";
import { ValidationError } from "../../core/errors/validationError.js";

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
 * Check if a schema is a Zod schema type
 */
function isZodSchema(schema: z.ZodTypeAny | object): schema is z.ZodTypeAny {
  return schema != null && typeof schema === "object" && "_def" in schema;
}

/**
 * Convert Zod schema to JSON Schema recursively
 */
function convertZodToJSONSchema(schema: z.ZodTypeAny): JSONSchema {
  return (
    handleWrappedSchemas(schema) ??
    handleObjectSchema(schema) ??
    handlePrimitiveSchemas(schema) ??
    handleComplexSchemas(schema) ?? { type: "object" }
  );
}

/**
 * Handle wrapped Zod schema types (Optional, Nullable, Default)
 */
function handleWrappedSchemas(schema: z.ZodTypeAny): JSONSchema | null {
  if (schema instanceof z.ZodOptional) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const unwrapped = schema.unwrap();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return convertZodToJSONSchema(unwrapped);
  }

  if (schema instanceof z.ZodNullable) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const unwrapped = schema.unwrap();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return convertZodToJSONSchema(unwrapped);
  }

  if (schema instanceof z.ZodDefault) {
    try {
      const def = (schema as unknown as Record<string, unknown>)._def as Record<
        string,
        unknown
      >;
      const innerType = def.innerType as z.ZodTypeAny;
      const defaultValueFn = def.defaultValue as () => unknown;
      const innerSchema = convertZodToJSONSchema(innerType);
      return {
        ...innerSchema,
        default: defaultValueFn(),
      };
    } catch {
      // Fallback if default handling fails
      return { type: "object" };
    }
  }

  return null;
}

/**
 * Handle Zod object schemas
 */
function handleObjectSchema(schema: z.ZodTypeAny): JSONSchema | null {
  if (!(schema instanceof z.ZodObject)) {
    return null;
  }

  const shape = (schema as unknown as { shape: Record<string, z.ZodTypeAny> })
    .shape;
  const properties: Record<string, JSONSchema> = {};
  const required: string[] = [];

  for (const [key, fieldSchema] of Object.entries(shape)) {
    const isOptional = fieldSchema instanceof z.ZodOptional;
    properties[key] = convertZodToJSONSchema(fieldSchema);

    if (!isOptional) {
      required.push(key);
    }
  }

  return {
    type: "object",
    properties,
    required: required.length > 0 ? required : undefined,
  };
}

/**
 * Handle primitive Zod schema types
 */
function handlePrimitiveSchemas(schema: z.ZodTypeAny): JSONSchema | null {
  if (schema instanceof z.ZodString) {
    return { type: "string" };
  }

  if (schema instanceof z.ZodNumber) {
    return { type: "number" };
  }

  if (schema instanceof z.ZodBoolean) {
    return { type: "boolean" };
  }

  return null;
}

/**
 * Handle complex Zod schema types (Enum, Literal, Array, Union)
 */
function handleComplexSchemas(schema: z.ZodTypeAny): JSONSchema | null {
  if (schema instanceof z.ZodEnum) {
    const options = (schema as unknown as { options: string[] }).options;
    return {
      type: "string",
      enum: options,
    };
  }

  if (schema instanceof z.ZodLiteral) {
    const value = (schema as unknown as { value: unknown }).value;
    return {
      type: typeof value as string,
      enum: [value],
    };
  }

  if (schema instanceof z.ZodArray) {
    const element = (schema as unknown as { element: z.ZodTypeAny }).element;
    return {
      type: "array",
      items: convertZodToJSONSchema(element),
    };
  }

  if (schema instanceof z.ZodUnion) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return handleUnionSchema(schema);
  }

  return null;
}

/**
 * Handle Zod union schemas
 */
function handleUnionSchema(
  schema: z.ZodUnion<[z.ZodTypeAny, ...z.ZodTypeAny[]]>,
): JSONSchema {
  const options = (schema as unknown as { options: z.ZodTypeAny[] }).options;
  const allLiterals = options.every((option) => option instanceof z.ZodLiteral);

  if (allLiterals) {
    const values = options.map(
      (option) => (option as unknown as { value: unknown }).value,
    );
    const firstType = typeof values[0];
    const allSameType = values.every((value) => typeof value === firstType);

    if (allSameType) {
      return {
        type: firstType,
        enum: values,
      };
    }
  }

  return { type: "object" };
}
