import type { UnifiedTerminationSignal } from "./unifiedTerminationSignal";
import type { EnhancedTerminationReason } from "./enhancedTerminationReason";
import type { TerminationConfidence } from "./terminationConfidence";

/**
 * Creates a basic UnifiedTerminationSignal from minimal information.
 * Useful for fallback scenarios when provider doesn't support enhanced detection.
 *
 * @param shouldTerminate - Primary termination decision
 * @param originalField - Source field from provider response
 * @param originalValue - Source value from provider response
 * @param reason - Optional termination reason (defaults to "unknown")
 * @param confidence - Optional confidence level (defaults to "low")
 * @param message - Optional human-readable explanation
 * @param metadata - Optional additional provider metadata
 * @returns Complete UnifiedTerminationSignal
 *
 * @example Basic signal creation
 * ```typescript
 * const signal = createTerminationSignal(
 *   true,
 *   "finished",
 *   "true",
 *   "natural_completion",
 *   "medium"
 * );
 * ```
 */
export function createTerminationSignal(
  shouldTerminate: boolean,
  originalField: string,
  originalValue: string,
  reason: EnhancedTerminationReason = "unknown",
  confidence: TerminationConfidence = "low",
  message?: string,
  metadata?: Record<string, unknown>,
): UnifiedTerminationSignal {
  return {
    shouldTerminate,
    reason,
    confidence,
    providerSpecific: {
      originalField,
      originalValue,
      metadata,
    },
    message,
  };
}
