import { MINIMUM_CACHE_SIZE } from "./cacheUtils";

/**
 * Determines if content should be cached based on length.
 * Only content that meets the minimum size requirement should be cached
 * to ensure effective use of Anthropic's caching system.
 *
 * @param content - Text content to evaluate for caching
 * @returns True if content meets minimum size requirement for caching
 */
export function shouldCacheContent(content: string): boolean {
  return content.length >= MINIMUM_CACHE_SIZE;
}
