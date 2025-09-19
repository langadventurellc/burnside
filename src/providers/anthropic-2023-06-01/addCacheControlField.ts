import { createCacheControlObject } from "./createCacheControlObject";

/**
 * Adds cache control field to content item.
 * Creates a new object with the cache_control field added to enable
 * server-side prompt caching for the content.
 *
 * @param item - Content item to add cache control to
 * @returns New object with cache_control field added
 */
export function addCacheControlField(item: unknown): unknown {
  if (typeof item !== "object" || item === null) {
    // For primitive types, wrap in object with cache control
    return {
      original: item,
      cache_control: createCacheControlObject(),
    };
  }

  // For objects, spread existing properties and add cache control
  return {
    ...item,
    cache_control: createCacheControlObject(),
  };
}
