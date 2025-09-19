/**
 * Confidence level for termination signal reliability.
 * Indicates how certain the detection logic is about the termination decision.
 *
 * @example Confidence levels
 * ```typescript
 * const highConfidence: TerminationConfidence = "high";
 * // Strong provider signal (e.g., explicit finish_reason with known value)
 *
 * const mediumConfidence: TerminationConfidence = "medium";
 * // Inferred from context (e.g., conversation patterns, partial signals)
 *
 * const lowConfidence: TerminationConfidence = "low";
 * // Fallback/unknown signal interpretation
 * ```
 */
export type TerminationConfidence = "high" | "medium" | "low";
