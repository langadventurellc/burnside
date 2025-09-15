/**
 * Common Validation Schemas
 *
 * Reusable Zod schemas for common data types like emails, URLs, and timestamps.
 */

import { z } from "zod";

/**
 * Combined schema object containing common validation patterns.
 */
export const commonSchemas = {
  /**
   * Email validation schema with comprehensive pattern matching.
   */
  email: z.string().email("Invalid email format"),

  /**
   * URL validation schema supporting http and https protocols.
   */
  url: z.string().url("Invalid URL format"),

  /**
   * ISO 8601 timestamp validation schema.
   */
  timestamp: z.string().datetime("Invalid ISO 8601 timestamp format"),

  /**
   * Unix timestamp validation schema (seconds since epoch).
   */
  unixTimestamp: z.number().int().min(0, "Unix timestamp must be non-negative"),
};
