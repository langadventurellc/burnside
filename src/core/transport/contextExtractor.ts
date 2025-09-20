/**
 * Request Context Extraction Utilities
 *
 * Helper functions to extract rate limiting context from HTTP requests.
 * Parses provider information, model details, and authentication from
 * request URLs, headers, and bodies for scope key generation.
 *
 * @example Extracting rate limit context
 * ```typescript
 * const request: ProviderHttpRequest = {
 *   url: "https://api.openai.com/v1/chat/completions",
 *   method: "POST",
 *   headers: { "Authorization": "Bearer sk-abc123" },
 *   body: JSON.stringify({ model: "gpt-4", messages: [...] })
 * };
 *
 * const context = extractRateLimitContext(request);
 * // { provider: "openai", model: "gpt-4", keyHash: "a1b2c3" }
 * ```
 */

import type { ProviderHttpRequest } from "./providerHttpRequest";
import type { RateLimitContext } from "./rateLimiting/rateLimitContext";

/**
 * Extracts rate limiting context from an HTTP request.
 *
 * Parses the request URL, headers, and body to generate context information
 * used for rate limiting scope key generation. Handles common provider patterns
 * and gracefully handles missing or malformed data.
 *
 * @param request - HTTP request to extract context from
 * @returns Rate limiting context with provider, model, and key information
 */
export function extractRateLimitContext(
  request: ProviderHttpRequest,
): RateLimitContext {
  const provider = extractProviderFromRequest(request);
  const model = extractModelFromRequest(request);
  const keyHash = extractKeyHashFromRequest(request);

  return {
    provider,
    model,
    keyHash,
  };
}

/**
 * Extracts provider name from request URL.
 *
 * Maps common provider hostnames to standardized provider names.
 * Defaults to "unknown" for unrecognized providers.
 *
 * @param request - HTTP request to extract provider from
 * @returns Standardized provider name
 */
function extractProviderFromRequest(request: ProviderHttpRequest): string {
  try {
    const url = new URL(request.url);
    const hostname = url.hostname.toLowerCase();

    // Map common provider hostnames to standard names
    if (hostname.includes("openai.com")) {
      return "openai";
    }
    if (hostname.includes("anthropic.com")) {
      return "anthropic";
    }
    if (hostname.includes("googleapis.com")) {
      return "google";
    }
    if (hostname.includes("x.ai")) {
      return "xai";
    }

    // Extract base domain for unknown providers
    const parts = hostname.split(".");
    if (parts.length >= 2) {
      return parts[parts.length - 2];
    }

    return "unknown";
  } catch {
    return "unknown";
  }
}

/**
 * Extracts model name from request body.
 *
 * Attempts to parse JSON body and extract the "model" field.
 * Returns undefined if model cannot be determined.
 *
 * @param request - HTTP request to extract model from
 * @returns Model name if found, undefined otherwise
 */
function extractModelFromRequest(
  request: ProviderHttpRequest,
): string | undefined {
  try {
    if (!request.body || typeof request.body !== "string") {
      return undefined;
    }

    const parsed: unknown = JSON.parse(request.body);
    if (typeof parsed === "object" && parsed !== null && "model" in parsed) {
      const model = (parsed as { model: unknown }).model;
      return typeof model === "string" ? model : undefined;
    }
    return undefined;
  } catch {
    return undefined;
  }
}

/**
 * Extracts and hashes API key from Authorization header.
 *
 * Creates a short hash of the authorization token for scope key generation
 * while preserving privacy. Returns "anonymous" if no auth header found.
 *
 * @param request - HTTP request to extract key hash from
 * @returns Short hash of the API key or "anonymous"
 */
function extractKeyHashFromRequest(request: ProviderHttpRequest): string {
  const authHeader =
    request.headers?.["Authorization"] || request.headers?.["authorization"];

  if (!authHeader || typeof authHeader !== "string") {
    return "anonymous";
  }

  // Extract the actual token (after "Bearer " or "Basic " etc.)
  const tokenMatch = authHeader.match(/\S+\s+(.+)/);
  const token = tokenMatch ? tokenMatch[1] : authHeader;

  // Create a simple hash (first 8 chars of base64 encoded token)
  return btoa(token).substring(0, 8).toLowerCase();
}
