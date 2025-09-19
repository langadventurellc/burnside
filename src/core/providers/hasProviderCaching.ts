import type { ProviderPlugin } from "./providerPlugin";

/**
 * Check if a provider plugin supports caching capabilities.
 *
 * Determines whether the provided plugin implements the optional
 * caching methods required for server-side prompt caching.
 *
 * @param plugin - The provider plugin to check
 * @returns true if the plugin supports caching, false otherwise
 *
 * @example
 * ```typescript
 * import { hasProviderCaching } from "./hasProviderCaching";
 *
 * if (hasProviderCaching(anthropicPlugin)) {
 *   console.log("Provider supports caching");
 * }
 * ```
 */
export function hasProviderCaching(plugin: ProviderPlugin): boolean {
  return (
    typeof plugin.supportsCaching === "function" ||
    typeof plugin.getCacheHeaders === "function" ||
    typeof plugin.markForCaching === "function"
  );
}
