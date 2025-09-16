/**
 * Anthropic Messages API Configuration Schema
 *
 * Configuration schema for the Anthropic Messages API provider, implementing
 * comprehensive validation with security-focused constraints including HTTPS
 * enforcement and API key format validation.
 */

import { z } from "zod";

/**
 * Zod schema for Anthropic Messages API configuration validation
 *
 * Implements comprehensive validation including:
 * - API key format validation (must start with 'sk-ant-')
 * - HTTPS enforcement for base URL (prevents SSRF attacks)
 * - Date format validation for API version
 * - Timeout and retry constraints
 */
export const AnthropicMessagesConfigSchema = z.object({
  /** API key validation with format enforcement */
  apiKey: z
    .string({ required_error: "API key is required" })
    .min(1, "API key is required")
    .startsWith("sk-ant-", "Invalid Anthropic API key format"),

  /** Base URL validation with HTTPS enforcement */
  baseUrl: z
    .string()
    .url("Invalid base URL format")
    .refine(
      (url) => url.startsWith("https://"),
      "Base URL must use HTTPS protocol",
    )
    .default("https://api.anthropic.com"),

  /** API version validation with date format requirement */
  version: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Version must be in YYYY-MM-DD format")
    .default("2023-06-01"),

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
 * Inferred TypeScript type from the Anthropic Messages config schema
 */
export type AnthropicMessagesConfigType = z.infer<
  typeof AnthropicMessagesConfigSchema
>;
