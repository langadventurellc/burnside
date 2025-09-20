/**
 * Anthropic-specific prompt caching constants.
 *
 * Provides key constants for implementing Anthropic's
 * server-side prompt caching support using the anthropic-beta API.
 */

/**
 * Anthropic beta header required for prompt caching support.
 * This header enables the prompt caching feature in Anthropic's API.
 */
export const ANTHROPIC_CACHE_HEADER =
  "anthropic-beta: prompt-caching-2024-07-31";

/**
 * Minimum content size in characters to qualify for caching.
 * Approximates 1024 tokens as recommended by Anthropic for effective caching.
 */
export const MINIMUM_CACHE_SIZE = 4000;
