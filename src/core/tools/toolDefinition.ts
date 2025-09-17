/**
 * Tool Definition Interface
 *
 * Interface defining the structure and metadata for a tool that can be
 * executed by the LLM Bridge library. Provides the foundation for tool
 * registration and invocation across different providers.
 *
 * Enhanced with comprehensive Zod validation supporting both Zod schemas
 * and JSON Schema-style parameters for maximum flexibility.
 *
 * @example
 * ```typescript
 * import { z } from "zod";
 *
 * // Using Zod schema (recommended)
 * const zodTool: ToolDefinition = {
 *   name: "get_weather",
 *   description: "Get current weather for a location",
 *   inputSchema: z.object({
 *     location: z.string().min(1, "Location is required"),
 *     units: z.enum(["celsius", "fahrenheit"]).optional()
 *   }),
 *   outputSchema: z.object({
 *     temperature: z.number(),
 *     description: z.string()
 *   })
 * };
 *
 * // JSON Schema format (backward compatibility)
 * const jsonTool: ToolDefinition = {
 *   name: "get_weather",
 *   description: "Get current weather for a location",
 *   inputSchema: {
 *     type: "object",
 *     properties: {
 *       location: { type: "string", description: "City name" }
 *     },
 *     required: ["location"]
 *   }
 * };
 * ```
 */

import type { z } from "zod";
import type { ToolDefinitionSchema } from "./toolDefinitionSchema";

/**
 * ToolDefinition type derived from comprehensive Zod schema validation.
 * Supports both Zod schemas and JSON Schema objects for input/output validation.
 */
export type ToolDefinition = z.infer<typeof ToolDefinitionSchema>;
