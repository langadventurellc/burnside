import type { ProviderPlugin } from "./providerPlugin";

/**
 * Add cache headers to existing HTTP headers.
 *
 * Merges cache-specific headers from the provider plugin with
 * existing request headers. If the plugin doesn't support caching
 * or doesn't implement getCacheHeaders, returns the original headers.
 *
 * @param plugin - The provider plugin to get cache headers from
 * @param headers - Existing HTTP headers to merge with
 * @returns Combined headers with cache headers added
 *
 * @example
 * ```typescript
 * import { addCacheHeaders } from "./addCacheHeaders";
 *
 * const headers = { "Content-Type": "application/json" };
 * const withCache = addCacheHeaders(anthropicPlugin, headers);
 * console.log(withCache);
 * // { "Content-Type": "application/json", "anthropic-beta": "prompt-caching-2024-07-31" }
 * ```
 */
export function addCacheHeaders(
  plugin: ProviderPlugin,
  headers: Record<string, string>,
): Record<string, string> {
  if (typeof plugin.getCacheHeaders !== "function") {
    return headers;
  }

  try {
    const cacheHeaders = plugin.getCacheHeaders();
    return { ...headers, ...cacheHeaders };
  } catch {
    // If cache header generation fails, return original headers
    // This ensures requests don't fail due to caching issues
    return headers;
  }
}
