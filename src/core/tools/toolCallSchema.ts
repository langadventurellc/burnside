/**
 * Tool Call Zod Schema
 *
 * Comprehensive Zod validation schema for the ToolCall interface providing
 * runtime validation and type inference for tool execution requests.
 *
 * @example
 * ```typescript
 * import { ToolCallSchema } from "./toolCallSchema.js";
 *
 * const result = ToolCallSchema.parse({
 *   id: "call_abc123",
 *   name: "calculate_sum",
 *   parameters: { a: 5, b: 3 },
 *   metadata: {
 *     providerId: "openai",
 *     timestamp: "2024-01-15T10:30:00.000Z"
 *   }
 * });
 * ```
 */

import { z } from "zod";
import { commonSchemas } from "../validation/commonSchemas.js";
import type { ToolCall } from "./toolCall.js";

/**
 * UUID validation schema for tool call identifiers.
 * Ensures tool call IDs follow proper UUID format for uniqueness.
 */
const toolCallIdSchema = z
  .string()
  .min(1, "Tool call ID cannot be empty")
  .max(255, "Tool call ID cannot exceed 255 characters");

/**
 * Parameters validation schema for tool input data.
 * Accepts any record of string keys to unknown values with validation.
 */
const parametersSchema = z
  .record(z.string(), z.unknown())
  .refine(
    (params) => typeof params === "object" && params !== null,
    "Parameters must be a valid object",
  );

/**
 * Metadata validation schema for tool call context information.
 * All fields are optional but must meet format requirements when present.
 */
const metadataSchema = z
  .object({
    /**
     * Provider identifier validation.
     * Must be a non-empty string with reasonable length limits.
     */
    providerId: z
      .string()
      .min(1, "Provider ID cannot be empty")
      .max(50, "Provider ID cannot exceed 50 characters")
      .regex(
        /^[a-zA-Z0-9_-]+$/,
        "Provider ID must contain only alphanumeric characters, underscores, and hyphens",
      )
      .optional(),

    /**
     * ISO 8601 timestamp validation.
     * Ensures proper timestamp format for execution tracking.
     */
    timestamp: commonSchemas.timestamp.optional(),

    /**
     * Context identifier validation.
     * Must be a non-empty string for session/conversation tracking.
     */
    contextId: z
      .string()
      .min(1, "Context ID cannot be empty")
      .max(255, "Context ID cannot exceed 255 characters")
      .optional(),
  })
  .strict()
  .optional();

/**
 * Comprehensive ToolCall validation schema.
 *
 * Validates all required and optional fields of a ToolCall with strict typing
 * and meaningful error messages. Ensures tool calls meet system requirements
 * before execution.
 */
export const ToolCallSchema = z
  .object({
    /**
     * Unique tool call identifier.
     * Required for correlating calls with results.
     */
    id: toolCallIdSchema,

    /**
     * Tool name to execute.
     * Must match registered tool name patterns.
     */
    name: commonSchemas.toolName,

    /**
     * Tool input parameters.
     * Flexible object structure validated at runtime.
     */
    parameters: parametersSchema,

    /**
     * Optional execution metadata.
     * Provides context and tracking information.
     */
    metadata: metadataSchema,
  })
  .strict()
  .refine((toolCall) => {
    // Additional validation for parameter structure
    if (toolCall.parameters && typeof toolCall.parameters !== "object") {
      return false;
    }
    return true;
  }, "Parameters must be a valid object structure");

/**
 * Type inference for ToolCall schema.
 * Ensures TypeScript type matches Zod validation schema.
 */
export type ToolCallSchemaType = z.infer<typeof ToolCallSchema>;

// Static type check to ensure schema matches interface
const _typeCheck: ToolCallSchemaType = {} as ToolCall;
const _interfaceCheck: ToolCall = {} as ToolCallSchemaType;
