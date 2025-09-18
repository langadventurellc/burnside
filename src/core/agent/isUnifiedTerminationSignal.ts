import type { UnifiedTerminationSignal } from "./unifiedTerminationSignal";

/**
 * Type guard to check if an object is a valid UnifiedTerminationSignal.
 *
 * @param value - Object to validate
 * @returns True if the object matches UnifiedTerminationSignal interface
 *
 * @example
 * ```typescript
 * const signal = provider.detectTermination(response);
 * if (isUnifiedTerminationSignal(signal)) {
 *   console.log(`Termination: ${signal.shouldTerminate}, Reason: ${signal.reason}`);
 * }
 * ```
 */
export function isUnifiedTerminationSignal(
  value: unknown,
): value is UnifiedTerminationSignal {
  if (!value || typeof value !== "object") {
    return false;
  }

  const signal = value as Record<string, unknown>;

  return (
    typeof signal.shouldTerminate === "boolean" &&
    typeof signal.reason === "string" &&
    typeof signal.confidence === "string" &&
    ["high", "medium", "low"].includes(signal.confidence) &&
    typeof signal.providerSpecific === "object" &&
    signal.providerSpecific !== null &&
    typeof (signal.providerSpecific as Record<string, unknown>)
      .originalField === "string" &&
    typeof (signal.providerSpecific as Record<string, unknown>)
      .originalValue === "string"
  );
}
