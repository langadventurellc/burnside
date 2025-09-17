/**
 * Google Gemini v1 Provider Configuration Schema
 *
 * Configuration schema for the Google Gemini v1 provider, implementing
 * comprehensive validation with security-focused constraints including HTTPS
 * enforcement and timeout/retry configuration.
 */

import { z } from "zod";

/**
 * Zod schema for Google Gemini v1 configuration validation
 *
 * Implements comprehensive validation including:
 * - API key format validation (non-empty string)
 * - HTTPS enforcement for base URL (prevents SSRF attacks)
 * - Timeout and retry constraints
 * - Default Google Gemini API endpoint
 */
export const GoogleGeminiV1ConfigSchema = z.object({
  /** API key validation with format enforcement */
  apiKey: z
    .string({ required_error: "API key is required" })
    .min(1, "API key is required"),

  /** Base URL validation with HTTPS enforcement */
  baseUrl: z
    .string()
    .url("Invalid base URL format")
    .refine(
      (url) => url.startsWith("https://"),
      "Base URL must use HTTPS protocol",
    )
    .default("https://generativelanguage.googleapis.com/v1beta/"),

  /** Timeout validation with reasonable limits */
  timeout: z
    .number()
    .int("Timeout must be an integer")
    .positive("Timeout must be positive")
    .max(300000, "Timeout cannot exceed 300000ms")
    .default(30000),

  /** Retry count validation within safe bounds */
  maxRetries: z
    .number()
    .int("Max retries must be an integer")
    .min(0, "Max retries cannot be negative")
    .max(5, "Max retries cannot exceed 5")
    .default(3),
});

/**
 * Inferred TypeScript type from the Google Gemini v1 config schema
 */
export type GoogleGeminiV1Config = z.infer<typeof GoogleGeminiV1ConfigSchema>;
