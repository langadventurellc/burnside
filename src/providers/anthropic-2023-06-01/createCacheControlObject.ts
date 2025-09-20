/**
 * Creates the cache control object for Anthropic requests.
 * Returns the ephemeral cache control configuration used by Anthropic.
 *
 * @returns Cache control object with ephemeral type
 */
export function createCacheControlObject(): { type: string } {
  return { type: "ephemeral" };
}
