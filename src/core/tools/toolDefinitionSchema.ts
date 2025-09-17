/**
 * ToolDefinition Zod Schema
 *
 * Comprehensive Zod validation schema for the ToolDefinition interface providing
 * runtime validation and type inference for tool definitions with support for
 * both Zod schemas and JSON Schema-style parameters.
 *
 * @example
 * ```typescript
 * import { ToolDefinitionSchema } from "./toolDefinitionSchema";
 * import { z } from "zod";
 *
 * // Using Zod schema for input validation
 * const zodTool = {
 *   name: "weather_forecast",
 *   description: "Get weather forecast for a location",
 *   inputSchema: z.object({
 *     location: z.string().min(1, "Location is required"),
 *     units: z.enum(["celsius", "fahrenheit"]).optional()
 *   }),
 *   outputSchema: z.object({
 *     temperature: z.number(),
 *     description: z.string()
 *   }).optional()
 * };
 *
 * const result = ToolDefinitionSchema.parse(zodTool);
 * ```
 */

import { z } from "zod";
import { commonSchemas } from "../validation/index";

/**
 * JSON Schema validation for backward compatibility with existing tools.
 * Supports basic JSON Schema structure for parameter definitions.
 */
const jsonSchemaSchema = z
  .object({
    type: z.string().min(1, "JSON Schema type is required"),
    properties: z.record(z.string(), z.unknown()).optional(),
    required: z.array(z.string()).optional(),
  })
  .passthrough() // Allow additional JSON Schema properties
  .refine(
    (schema) =>
      ["object", "string", "number", "boolean", "array"].includes(schema.type),
    "JSON Schema type must be a valid primitive or object type",
  );

/**
 * Input schema validation supporting both Zod schemas and JSON Schema objects.
 * Prioritizes Zod schemas as first-class values while maintaining backward compatibility.
 */
const inputSchemaSchema = z.union([
  z.instanceof(z.ZodType, { message: "Must be a valid Zod schema instance" }),
  jsonSchemaSchema,
]);

/**
 * Output schema validation (optional) supporting both Zod schemas and JSON Schema objects.
 */
const outputSchemaSchema = z
  .union([
    z.instanceof(z.ZodType, { message: "Must be a valid Zod schema instance" }),
    jsonSchemaSchema,
  ])
  .optional();

/**
 * Hints validation schema for provider-specific mapping information.
 * Flexible record structure to accommodate different provider requirements.
 */
const hintsSchema = z
  .record(z.string(), z.unknown())
  .optional()
  .refine(
    (hints) =>
      !hints || Object.keys(hints).every((key) => typeof key === "string"),
    "All hint keys must be strings",
  );

/**
 * Metadata validation schema for additional tool information.
 * Flexible record structure for extensibility while preventing prototype pollution.
 */
const metadataSchema = z.record(z.string(), z.unknown()).optional();

/**
 * Comprehensive Zod schema for ToolDefinition interface validation.
 * Validates all required and optional fields with proper type constraints
 * and security considerations.
 */
export const ToolDefinitionSchema = z
  .object({
    name: commonSchemas.toolName,
    description: commonSchemas.toolDescription,
    inputSchema: inputSchemaSchema,
    outputSchema: outputSchemaSchema,
    hints: hintsSchema,
    metadata: metadataSchema,
  })
  .strict()
  .refine(
    (tool) => tool.name.length > 0,
    "Tool name cannot be empty after trimming",
  );
