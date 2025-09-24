/**
 * xAI v1 Provider Configuration Schema
 *
 * Configuration schema for the xAI v1 provider, implementing comprehensive
 * validation with security-focused constraints including HTTPS enforcement,
 * API key format validation, and timeout/retry configuration.
 */

import { z } from "zod";

/**
 * Zod schema for xAI v1 configuration validation
 *
 * Implements comprehensive validation including:
 * - API key format validation (must start with 'xai-')
 * - HTTPS enforcement for base URL (prevents SSRF attacks)
 * - Timeout and retry constraints
 * - Default xAI API endpoint
 * - Optional organization, project, and custom headers support
 */
export const XAIV1ConfigSchema = z.object({
  /** API key validation with xAI-specific format enforcement */
  apiKey: z
    .string({
      error: (issue) =>
        issue.input === undefined ? "API key is required" : undefined,
    })
    .min(1, "API key is required")
    .startsWith("xai-", "API key must start with 'xai-'"),

  /** Base URL validation with HTTPS enforcement */
  baseUrl: z
    .url("Invalid base URL format")
    .refine(
      (url) => url.startsWith("https://"),
      "Base URL must use HTTPS protocol",
    )
    .prefault("https://api.x.ai/v1"),

  /** Timeout validation with reasonable limits */
  timeout: z
    .int("Timeout must be an integer")
    .positive("Timeout must be positive")
    .max(300000, "Timeout cannot exceed 300000ms")
    .optional(),

  /** xAI organization ID (optional) */
  organization: z.string().optional(),

  /** xAI project ID (optional) */
  project: z.string().optional(),

  /** Custom headers to include in requests (optional) */
  headers: z.record(z.string(), z.string()).optional(),

  /** Retry count validation within safe bounds */
  maxRetries: z
    .int("Max retries must be an integer")
    .min(0, "Max retries cannot be negative")
    .max(5, "Max retries cannot exceed 5")
    .prefault(3),
});

/**
 * Inferred TypeScript type from the xAI v1 config schema
 */
export type XAIV1Config = z.infer<typeof XAIV1ConfigSchema>;
