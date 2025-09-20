import type { ProviderPlugin } from "./providerPlugin";

/**
 * Apply cache markers to request content.
 *
 * Uses the provider plugin's markForCaching method to add cache control
 * markers to the request content. If the plugin doesn't support caching
 * or doesn't implement markForCaching, returns the original content.
 *
 * @param plugin - The provider plugin to apply cache markers from
 * @param content - The content to mark for caching
 * @returns Content with cache control markers applied
 *
 * @example
 * ```typescript
 * import { applyCacheMarkers } from "./applyCacheMarkers";
 *
 * const content = { messages: [...], tools: [...] };
 * const markedContent = applyCacheMarkers(anthropicPlugin, content);
 * // Returns content with cache_control fields added to eligible items
 * ```
 */
export function applyCacheMarkers(
  plugin: ProviderPlugin,
  content: unknown,
): unknown {
  if (typeof plugin.markForCaching !== "function") {
    return content;
  }

  try {
    return plugin.markForCaching(content);
  } catch {
    // If cache marking fails, return original content
    // This ensures requests don't fail due to caching issues
    return content;
  }
}
