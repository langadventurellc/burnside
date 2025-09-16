/**
 * Echo Tool Input Validation Schema
 *
 * Zod schema for Echo tool input validation. Accepts any JSON-serializable
 * record structure for maximum flexibility while maintaining type safety.
 */

import { z } from "zod";

/**
 * Flexible input schema that accepts any JSON-serializable record structure.
 * Uses z.record(z.unknown()) to handle arbitrary parameter combinations
 * while maintaining type safety and validation.
 */
export const EchoInputSchema = z
  .record(z.string(), z.unknown())
  .describe("Input parameters to echo back - accepts any key-value pairs");
