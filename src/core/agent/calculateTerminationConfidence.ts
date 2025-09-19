import type { TerminationConfidence } from "./terminationConfidence";

/**
 * Extracts confidence level from termination signal reliability indicators.
 * Helper function for provider implementations to standardize confidence scoring.
 *
 * @param hasExplicitSignal - Whether provider gave explicit termination field
 * @param isWellKnownValue - Whether the termination value is documented/expected
 * @param hasMetadata - Whether additional context is available
 * @returns Appropriate confidence level
 *
 * @example
 * ```typescript
 * const confidence = calculateTerminationConfidence(
 *   true,  // has finish_reason field
 *   true,  // value is "stop" (well-known)
 *   true   // has usage metadata
 * ); // Returns "high"
 * ```
 */
export function calculateTerminationConfidence(
  hasExplicitSignal: boolean,
  isWellKnownValue: boolean,
  hasMetadata: boolean = false,
): TerminationConfidence {
  if (hasExplicitSignal && isWellKnownValue) {
    return hasMetadata ? "high" : "high";
  }
  if (hasExplicitSignal || isWellKnownValue) {
    return "medium";
  }
  return "low";
}
