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

  /**
   * Base64 data validation schema for encoded content.
   */
  base64: z
    .string()
    .min(1, "Base64 data cannot be empty")
    .regex(
      /^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/,
      "Must be valid base64 data",
    ),

  /**
   * Image MIME type validation schema for supported image formats.
   */
  imageMimeType: z.enum(
    ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"],
    {
      errorMap: () => ({
        message:
          "Must be a supported image MIME type (jpeg, png, gif, webp, svg+xml)",
      }),
    },
  ),

  /**
   * Document MIME type validation schema for supported document formats.
   */
  documentMimeType: z.enum(
    [
      "application/pdf",
      "text/plain",
      "text/markdown",
      "application/json",
      "text/csv",
      "application/xml",
      "text/xml",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ],
    {
      errorMap: () => ({ message: "Must be a supported document MIME type" }),
    },
  ),

  /**
   * Filename validation schema with reasonable character restrictions.
   */
  filename: z
    .string()
    .min(1, "Filename cannot be empty")
    .max(255, "Filename cannot exceed 255 characters")
    .regex(
      /^[a-zA-Z0-9._-]+$/,
      "Filename can only contain letters, numbers, dots, underscores, and hyphens",
    ),

  /**
   * Programming language identifier validation schema.
   */
  languageIdentifier: z
    .string()
    .min(1, "Language identifier cannot be empty")
    .max(50, "Language identifier cannot exceed 50 characters")
    .regex(
      /^[a-zA-Z0-9+#-]+$/,
      "Language identifier can only contain letters, numbers, +, #, and hyphens",
    ),
};
