/**
 * Echo Tool Output Validation Schema
 *
 * Zod schema for Echo tool output validation. Defines structured output
 * format containing echoed input data plus execution metadata.
 */

import { z } from "zod";

/**
 * Structured output schema containing echoed input data plus execution metadata.
 * Provides consistent output format for testing and debugging purposes.
 */
export const EchoOutputSchema = z.object({
  echoed: z
    .record(z.string(), z.unknown())
    .describe("Echoed input parameters identical to provided input"),
  metadata: z.object({
    timestamp: z
      .string()
      .datetime()
      .describe("ISO 8601 timestamp of tool execution"),
    contextId: z
      .string()
      .min(1)
      .describe("Execution context identifier for tracking"),
  }),
});
