import type { RateLimitValidationResult } from "./rateLimitValidationResult";

/**
 * Validates that request timestamps follow expected rate limiting behavior
 *
 * @param requestTimestamps - Array of request start timestamps in milliseconds
 * @param expectedRps - Expected requests per second limit
 * @param toleranceMs - Allowed timing tolerance in milliseconds (default: 200ms)
 * @returns Validation result with details
 *
 * @example
 * ```typescript
 * const timestamps = [1000, 1500, 2000, 2500]; // 4 requests over 1.5 seconds
 * const result = validateRateLimitingBehavior(timestamps, 2, 200);
 * // result.valid = true, result.actualRps ≈ 2.0
 * ```
 */
export function validateRateLimitingBehavior(
  requestTimestamps: number[],
  expectedRps: number,
  toleranceMs: number = 200,
): RateLimitValidationResult {
  if (requestTimestamps.length < 2) {
    return {
      valid: false,
      actualRps: 0,
      message: "Need at least 2 requests to validate rate limiting",
    };
  }

  const sortedTimestamps = [...requestTimestamps].sort((a, b) => a - b);
  const timeSpanMs =
    sortedTimestamps[sortedTimestamps.length - 1] - sortedTimestamps[0];
  const timeSpanSeconds = timeSpanMs / 1000;

  // Calculate actual RPS based on request count and time span
  // Use (requests - 1) since we measure the time from first to last request
  const actualRps =
    timeSpanSeconds > 0 ? (sortedTimestamps.length - 1) / timeSpanSeconds : 0;

  // Calculate minimum expected time for the given RPS with tolerance
  const expectedMinTimeMs =
    ((sortedTimestamps.length - 1) / expectedRps) * 1000;
  const actualTimeMs = timeSpanMs;

  // Validation: actual time should be at least the expected time minus tolerance
  const valid = actualTimeMs >= expectedMinTimeMs - toleranceMs;

  return {
    valid,
    actualRps,
    message: valid
      ? `Rate limiting validated: ${actualRps.toFixed(2)} RPS over ${timeSpanSeconds.toFixed(2)}s`
      : `Rate limiting violation: expected >= ${expectedRps} RPS (${expectedMinTimeMs}ms), got ${actualRps.toFixed(2)} RPS (${actualTimeMs}ms)`,
  };
}
