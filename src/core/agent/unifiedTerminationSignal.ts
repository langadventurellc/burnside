import type { EnhancedTerminationReason } from "./enhancedTerminationReason";
import type { TerminationConfidence } from "./terminationConfidence";

/**
 * Unified termination signal that normalizes completion detection across all providers.
 *
 * Provides a consistent interface for termination decisions while preserving
 * provider-specific metadata for debugging and advanced use cases.
 *
 * @example Basic termination detection
 * ```typescript
 * const signal: UnifiedTerminationSignal = {
 *   shouldTerminate: true,
 *   reason: "natural_completion",
 *   confidence: "high",
 *   providerSpecific: {
 *     originalField: "finish_reason",
 *     originalValue: "stop",
 *     metadata: { model: "gpt-4" }
 *   },
 *   message: "Model completed response naturally"
 * };
 * ```
 *
 * @example Provider-aware termination with fallback
 * ```typescript
 * const signal: UnifiedTerminationSignal = {
 *   shouldTerminate: false,
 *   reason: "unknown",
 *   confidence: "low",
 *   providerSpecific: {
 *     originalField: "legacy_terminal_flag",
 *     originalValue: "false"
 *   }
 * };
 * ```
 *
 * @interface UnifiedTerminationSignal
 */
export interface UnifiedTerminationSignal {
  /**
   * Whether the conversation/stream should terminate.
   * Primary decision flag for multi-turn orchestration.
   */
  shouldTerminate: boolean;

  /**
   * Standardized reason for the termination decision.
   * Maps provider-specific signals to unified categories.
   */
  reason: EnhancedTerminationReason;

  /**
   * Confidence level in the termination detection.
   * - "high": Strong provider signal (e.g., explicit finish_reason)
   * - "medium": Inferred from context (e.g., conversation patterns)
   * - "low": Fallback/unknown signal interpretation
   */
  confidence: TerminationConfidence;

  /**
   * Provider-specific termination metadata for debugging and analysis.
   * Preserves original field names and values from provider response.
   */
  providerSpecific: {
    /** Original field name from provider response (e.g., "finish_reason", "stop_reason") */
    originalField: string;
    /** Original value from provider response (e.g., "stop", "length", "end_turn") */
    originalValue: string;
    /** Additional provider metadata (model, usage, etc.) */
    metadata?: Record<string, unknown>;
  };

  /**
   * Optional human-readable explanation of the termination decision.
   * Useful for debugging and user feedback.
   */
  message?: string;
}
