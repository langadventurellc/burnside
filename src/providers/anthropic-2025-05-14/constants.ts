/**
 * Default configuration constants for the Anthropic Messages API provider
 */
export const ANTHROPIC_DEFAULT_CONFIG = {
  baseUrl: "https://api.anthropic.com",
  version: "2025-05-14",
  timeout: 30000,
  maxRetries: 3,
} as const;
