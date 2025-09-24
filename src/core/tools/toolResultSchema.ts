/**
 * Tool Result Zod Schema
 *
 * Comprehensive Zod validation schema for the ToolResult interface providing
 * runtime validation and type inference for tool execution results with
 * mutually exclusive success/error states.
 *
 * @example Success Validation
 * ```typescript
 * import { ToolResultSchema } from "./toolResultSchema";
 *
 * const successResult = ToolResultSchema.parse({
 *   callId: "call_abc123",
 *   success: true,
 *   data: { sum: 8 },
 *   metadata: { executionTime: 150 }
 * });
 * ```
 *
 * @example Error Validation
 * ```typescript
 * const errorResult = ToolResultSchema.parse({
 *   callId: "call_abc123",
 *   success: false,
 *   error: {
 *     code: "validation_error",
 *     message: "Invalid parameter"
 *   }
 * });
 * ```
 */

import { z } from "zod";

/**
 * Tool call ID validation schema for result correlation.
 * Ensures results can be properly linked back to their originating calls.
 */
const callIdSchema = z
  .string()
  .min(1, "Call ID cannot be empty")
  .max(255, "Call ID cannot exceed 255 characters");

/**
 * Error information validation schema.
 * Provides structured error details for failed tool executions.
 */
const errorSchema = z.strictObject({
  /**
   * Error category or type code.
   * Should use consistent error codes across the system.
   */
  code: z
    .string()
    .min(1, "Error code cannot be empty")
    .max(100, "Error code cannot exceed 100 characters")
    .regex(
      /^[a-z0-9_-]+$/,
      "Error code must contain only lowercase letters, numbers, underscores, and hyphens",
    ),

  /**
   * Human-readable error message.
   * Should provide clear information about the failure.
   */
  message: z
    .string()
    .min(1, "Error message cannot be empty")
    .max(1000, "Error message cannot exceed 1000 characters"),

  /**
   * Optional additional error context.
   * Can contain structured information about the error condition.
   */
  details: z.unknown().optional(),
});

/**
 * Execution metadata validation schema.
 * Provides performance and tracking information for tool executions.
 */
const metadataSchema = z
  .strictObject({
    /**
     * Execution time in milliseconds.
     * Must be a non-negative number for performance tracking.
     */
    executionTime: z
      .int("Execution time must be an integer")
      .min(0, "Execution time cannot be negative")
      .max(3600000, "Execution time cannot exceed 1 hour (3600000ms)")
      .optional(),

    /**
     * Memory usage in bytes.
     * Must be a non-negative number for resource monitoring.
     */
    memoryUsage: z
      .int("Memory usage must be an integer")
      .min(0, "Memory usage cannot be negative")
      .max(1073741824, "Memory usage cannot exceed 1GB (1073741824 bytes)")
      .optional(),

    /**
     * Number of retry attempts.
     * Must be a non-negative integer for retry tracking.
     */
    retryCount: z
      .int("Retry count must be an integer")
      .min(0, "Retry count cannot be negative")
      .max(10, "Retry count cannot exceed 10")
      .optional(),
  })
  .optional();

/**
 * Success result validation schema.
 * Validates tool results when execution succeeds.
 */
const successResultSchema = z.strictObject({
  callId: callIdSchema,
  success: z.literal(true),
  data: z.unknown().optional(),
  metadata: metadataSchema,
});

/**
 * Error result validation schema.
 * Validates tool results when execution fails.
 */
const errorResultSchema = z.strictObject({
  callId: callIdSchema,
  success: z.literal(false),
  error: errorSchema,
  metadata: metadataSchema,
});

/**
 * Comprehensive ToolResult validation schema with discriminated union.
 *
 * Uses a discriminated union based on the success field to ensure
 * mutually exclusive success/error states. This provides type safety
 * and prevents invalid result combinations.
 */
export const ToolResultSchema = z
  .discriminatedUnion("success", [successResultSchema, errorResultSchema], {
    error: (issue) => {
      const code = issue.code as string;
      if (code === "invalid_union_discriminator") {
        return "ToolResult must have success field set to either true or false";
      }
      return;
    },
  })
  .refine((result) => {
    if (result.success && "error" in result) {
      return false;
    }
    if (!result.success && "data" in result) {
      return false;
    }
    return true;
  }, "Success and error states are mutually exclusive");

/**
 * Type inference for ToolResult schema.
 * Ensures TypeScript type matches Zod validation schema.
 */
export type ToolResultSchemaType = z.infer<typeof ToolResultSchema>;
